import * as fs from 'fs';
import * as path from 'path';
import { locations } from '../config';
import relative from 'require-relative';

let r: any;
let wp: any;

export class CompileError {
	file: string;
	line: number;
	column: number;
	message: string;
}

export class CompileResult {
	duration: number;
	errors: CompileError[];
	warnings: CompileError[];
	assets: string[];
	assetsByChunkName: Record<string, string>;
}

class RollupResult extends CompileResult {
	constructor(duration: number, stats: any) {
		super();

		this.duration = duration;

		this.errors = [];
		this.warnings = [];

		// TODO
		this.assets = [];

		this.assetsByChunkName = {
			// TODO need to hash these filenames and
			// expose the info in the Rollup output
			main: `client.js`
		};
	}

	print() {
		return 'TODO summarise build';
	}
}

class WebpackResult extends CompileResult {
	stats: any;

	constructor(stats: any) {
		super();

		this.stats = stats;

		const info = stats.toJson();

		// TODO use import()
		const format_messages = require('webpack-format-messages');
		const messages = format_messages(stats);

		this.errors = messages.errors.map(mungeWebpackError);
		this.warnings = messages.warnings.map(mungeWebpackError);

		this.duration = info.time;

		this.assets = info.assets.map((chunk: { name: string }) => chunk.name);
		this.assetsByChunkName = info.assetsByChunkName;
	}

	print() {
		return this.stats.toString({ colors: true });
	}
}

export class RollupCompiler {
	_: Promise<any>;
	_oninvalid: (filename: string) => void;
	_start: number;

	constructor(config: any) {
		this._ = this.get_config(path.resolve(config));
	}

	async get_config(input: string) {
		const bundle = await r.rollup({
			input,
			external: (id: string) => {
				return (id[0] !== '.' && !path.isAbsolute(id)) || id.slice(-5, id.length) === '.json';
			}
		});

		const { code } = await bundle.generate({ format: 'cjs' });

		// temporarily override require
		const defaultLoader = require.extensions['.js'];
		require.extensions['.js'] = (module: any, filename: string) => {
			if (filename === input) {
				module._compile(code, filename);
			} else {
				defaultLoader(module, filename);
			}
		};

		const mod: any = require(input);
		delete require.cache[input];

		return mod;
	}

	oninvalid(cb: (filename: string) => void) {
		this._oninvalid = cb;
	}

	async compile(): Promise<CompileResult> {
		const config = await this._;

		const start = Date.now();

		const bundle = await r.rollup(config);
		await bundle.write(config.output);

		return new RollupResult(Date.now() - start, bundle);
	}

	async watch(cb: (err?: Error, stats?: any) => void) {
		const config = await this._;

		const watcher = r.watch(config);

		watcher.on('event', (event: any) => {
			switch (event.code) {
				case 'FATAL':
					// TODO kill the process?
					cb(event.error);
					break;

				case 'ERROR':
					// TODO print warnings as well?
					cb(event.error);
					break;

				case 'START':
				case 'END':
					// TODO is there anything to do with this info?
					break;

				case 'BUNDLE_START':
					this._start = Date.now();
					// TODO figure out which file changed
					this._oninvalid('[TODO] unknown file');
					break;

				case 'BUNDLE_END':
					cb(null, new RollupResult(Date.now() - this._start, event.result));
					break;

				default:
					console.log(`Unexpected event ${event.code}`);
			}
		});
	}
}

export class WebpackCompiler {
	_: any;

	constructor(config: any) {
		this._ = wp(require(path.resolve(config)));
	}

	oninvalid(cb: (filename: string) => void) {
		this._.hooks.invalid.tap('sapper', cb);
	}

	compile(): Promise<CompileResult> {
		return new Promise((fulfil, reject) => {
			this._.run((err: Error, stats: any) => {
				if (err) {
					reject(err);
					process.exit(1);
				}

				const result = new WebpackResult(stats);

				if (result.errors.length) {
					// TODO print errors
					// console.error(stats.toString({ colors: true }));
					reject(new Error(`Encountered errors while building app`));
				}

				else {
					fulfil(result);
				}
			});
		});
	}

	watch(cb: (err?: Error, stats?: any) => void) {
		this._.watch({}, (err?: Error, stats?: any) => {
			cb(err, stats && new WebpackResult(stats));
		});
	}
}

export type Compiler = RollupCompiler | WebpackCompiler;

export type Compilers = {
	client: Compiler;
	server: Compiler;
	serviceworker?: Compiler;
}

export default function create_compilers(bundler: string, { webpack, rollup }: { webpack: string, rollup: string }): Compilers {
	if (bundler === 'rollup') {
		if (!r) r = relative('rollup', process.cwd());

		const sw = `${rollup}/service-worker.config.js`;

		return {
			client: new RollupCompiler(`${rollup}/client.config.js`),
			server: new RollupCompiler(`${rollup}/server.config.js`),
			serviceworker: fs.existsSync(sw) && new RollupCompiler(sw)
		};
	}

	if (bundler === 'webpack') {
		if (!wp) wp = relative('webpack', process.cwd());

		const sw = `${webpack}/service-worker.config.js`;

		return {
			client: new WebpackCompiler(`${webpack}/client.config.js`),
			server: new WebpackCompiler(`${webpack}/server.config.js`),
			serviceworker: fs.existsSync(sw) && new WebpackCompiler(sw)
		};
	}

	// this shouldn't be possible...
	throw new Error(`Invalid bundler option '${bundler}'`);
}

const locPattern = /\((\d+):(\d+)\)$/;

function mungeWebpackError(message: string) {
	// TODO this is all a bit rube goldberg...
	const lines = message.split('\n');

	const file = lines.shift()
		.replace('[7m', '') // careful — there is a special character at the beginning of this string
		.replace('[27m', '')
		.replace('./', '');

	let line = null;
	let column = null;

	const match = locPattern.exec(lines[0]);
	if (match) {
		lines[0] = lines[0].replace(locPattern, '');
		line = +match[1];
		column = +match[2];
	}

	return {
		file,
		line,
		column,
		message: lines.join('\n'),
		originalMessage: message
	};
}