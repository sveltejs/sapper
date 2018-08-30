import * as fs from 'fs';
import * as path from 'path';
import colors from 'kleur';
import pb from 'pretty-bytes';
import relative from 'require-relative';
import { left_pad } from '../utils';

let r: any;
let wp: any;

export class CompileError {
	file: string;
	message: string;
}

export class CompileResult {
	duration: number;
	errors: CompileError[];
	warnings: CompileError[];
	chunks: string[];
	assets: Record<string, string>;
}

class RollupResult extends CompileResult {
	summary: string;

	constructor(duration: number, compiler: RollupCompiler) {
		super();

		this.duration = duration;

		this.errors = compiler.errors.map(munge_rollup_warning_or_error);
		this.warnings = compiler.warnings.map(munge_rollup_warning_or_error); // TODO emit this as they happen

		this.chunks = compiler.chunks.map(chunk => chunk.fileName);

		// TODO populate this properly. We don't have namedcompiler. chunks, as in
		// webpack, but we can have a route -> [chunk] map or something
		this.assets = {};

		compiler.chunks.forEach(chunk => {
			if (compiler.input in chunk.modules) {
				this.assets.main = chunk.fileName;
			}
		});

		this.summary = compiler.chunks.map(chunk => {
			const size_color = chunk.code.length > 150000 ? colors.bold.red : chunk.code.length > 50000 ? colors.bold.yellow : colors.bold.white;
			const size_label = left_pad(pb(chunk.code.length), 10);

			const lines = [size_color(`${size_label} ${chunk.fileName}`)];

			const deps = Object.keys(chunk.modules)
				.map(file => {
					return {
						file: path.relative(process.cwd(), file),
						size: chunk.modules[file].renderedLength
					};
				})
				.filter(dep => dep.size > 0)
				.sort((a, b) => b.size - a.size);

			const total_unminified = deps.reduce((t, d) => t + d.size, 0);

			deps.forEach((dep, i) => {
				const c = i === deps.length - 1 ? '└' : '│';
				let line = `           ${c} ${dep.file}`;

				if (deps.length > 1) {
					const p = (100 * dep.size / total_unminified).toFixed(1);
					line += ` (${p}%)`;
				}

				lines.push(colors.gray(line));
			});

			return lines.join('\n');
		}).join('\n');
	}

	print() {
		const blocks: string[] = this.warnings.map(warning => {
			return warning.file
				? `> ${colors.bold(warning.file)}\n${warning.message}`
				: `> ${warning.message}`;
		});

		blocks.push(this.summary);

		return blocks.join('\n\n');
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

		this.errors = messages.errors.map(munge_webpack_warning_or_error);
		this.warnings = messages.warnings.map(munge_webpack_warning_or_error);

		this.duration = info.time;

		this.chunks = info.assets.map((chunk: { name: string }) => chunk.name);
		this.assets = info.assetsByChunkName;
	}

	print() {
		return this.stats.toString({ colors: true });
	}
}

export class RollupCompiler {
	_: Promise<any>;
	_oninvalid: (filename: string) => void;
	_start: number;
	input: string;
	warnings: any[];
	errors: any[];
	chunks: any[]; // TODO types

	constructor(config: any) {
		this._ = this.get_config(path.resolve(config));
		this.input = null;
		this.warnings = [];
		this.errors = [];
		this.chunks = [];
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

		(mod.plugins || (mod.plugins = [])).push({
			name: 'sapper-internal',
			options: (opts: any) => {
				this.input = opts.input;
			},
			renderChunk: (code: string, chunk: any) => {
				if (chunk.isEntry) {
					this.chunks.push(chunk);
				}
			}
		});

		const onwarn = mod.onwarn || ((warning: any, handler: (warning: any) => void) => {
			handler(warning);
		});

		mod.onwarn = (warning: any) => {
			onwarn(warning, (warning: any) => {
				this.warnings.push(warning);
			});
		};

		return mod;
	}

	oninvalid(cb: (filename: string) => void) {
		this._oninvalid = cb;
	}

	async compile(): Promise<CompileResult> {
		const config = await this._;

		const start = Date.now();

		try {
			const bundle = await r.rollup(config);
			await bundle.write(config.output);

			return new RollupResult(Date.now() - start, this);
		} catch (err) {
			if (err.filename) {
				// TODO this is a bit messy. Also, can
				// Rollup emit other kinds of error?
				err.message = [
					`Failed to build — error in ${err.filename}: ${err.message}`,
					err.frame
				].filter(Boolean).join('\n');
			}

			throw err;
		}
	}

	async watch(cb: (err?: Error, stats?: any) => void) {
		const config = await this._;

		const watcher = r.watch(config);

		watcher.on('change', (id: string) => {
			this.chunks = [];
			this.warnings = [];
			this.errors = [];
			this._oninvalid(id);
		});

		watcher.on('event', (event: any) => {
			switch (event.code) {
				case 'FATAL':
					// TODO kill the process?
					if (event.error.filename) {
						// TODO this is a bit messy. Also, can
						// Rollup emit other kinds of error?
						event.error.message = [
							`Failed to build — error in ${event.error.filename}: ${event.error.message}`,
							event.error.frame
						].filter(Boolean).join('\n');
					}

					cb(event.error);
					break;

				case 'ERROR':
					this.errors.push(event.error);
					cb(null, new RollupResult(Date.now() - this._start, this));
					break;

				case 'START':
				case 'END':
					// TODO is there anything to do with this info?
					break;

				case 'BUNDLE_START':
					this._start = Date.now();
					break;

				case 'BUNDLE_END':
					cb(null, new RollupResult(Date.now() - this._start, this));
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

function munge_webpack_warning_or_error(message: string) {
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
		message: lines.join('\n')
	};
}

function munge_rollup_warning_or_error(warning_or_error: any) {
	return {
		file: warning_or_error.filename,
		message: [warning_or_error.message, warning_or_error.frame].filter(Boolean).join('\n')
	};
}