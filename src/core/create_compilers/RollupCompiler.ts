import * as path from 'path';
import color from 'kleur';
import relative from 'require-relative';
import { InputOption, RollupError } from 'rollup';
import { CompileResult } from './interfaces';
import RollupResult from './RollupResult';

const stderr = console.error.bind(console);

let rollup: any;

export default class RollupCompiler {
	_: Promise<any>;
	_oninvalid: (filename: string) => void;
	_start: number;
	input: InputOption;
	warnings: any[];
	errors: any[];
	chunks: any[];
	css_files: Array<{ id: string; code: string }>;

	constructor(config: any) {
		this._ = this.get_config(config);
		this.input = null;
		this.warnings = [];
		this.errors = [];
		this.chunks = [];
		this.css_files = [];
	}

	async get_config(mod: any) {
		// TODO this is hacky, and doesn't need to apply to all three compilers
		(mod.plugins || (mod.plugins = [])).push({
			name: 'sapper-internal',
			options: (opts: any) => {
				this.input = opts.input;
			},
			renderChunk: (code: string, chunk: any) => {
				this.chunks.push(chunk);
			},
			transform: (code: string, id: string) => {
				if (/\.css$/.test(id)) {
					this.css_files.push({ id, code });
					return {code: '', moduleSideEffects: 'no-treeshake'};
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
		const sourcemap = config.output.sourcemap;

		const start = Date.now();

		try {
			const bundle = await rollup.rollup(config);
			await bundle.write(config.output);

			return new RollupResult(Date.now() - start, this, sourcemap);
		} catch (err) {
			// flush warnings
			stderr(new RollupResult(Date.now() - start, this, sourcemap).print());

			handleError(err);
		}
	}

	async watch(cb: (err?: Error, stats?: any) => void) {
		const config = await this._;
		const sourcemap = config.output.sourcemap;

		const watcher = rollup.watch(config);

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
					cb(null, new RollupResult(Date.now() - this._start, this, sourcemap));
					break;

				case 'START':
				case 'END':
					// TODO is there anything to do with this info?
					break;

				case 'BUNDLE_START':
					this._start = Date.now();
					break;

				case 'BUNDLE_END':
					cb(null, new RollupResult(Date.now() - this._start, this, sourcemap));
					break;

				default:
					console.log(`Unexpected event ${event.code}`);
			}
		});
	}

	static async load_config(cwd: string) {
		if (!rollup) rollup = relative('rollup', cwd);

		const input = path.resolve(cwd, 'rollup.config.js');

		const bundle = await rollup.rollup({
			input,
			inlineDynamicImports: true,
			external: (id: string) => {
				return (id[0] !== '.' && !path.isAbsolute(id)) || id.slice(-5, id.length) === '.json';
			}
		});

		const {
			output: [{ code }]
		} = await bundle.generate({
			exports: 'named',
			format: 'cjs'
		});

		// temporarily override require
		const defaultLoader = require.extensions['.js'];
		require.extensions['.js'] = (module: any, filename: string) => {
			if (filename === input) {
				module._compile(code, filename);
			} else {
				defaultLoader(module, filename);
			}
		};

		const config: any = require(input).default;
		delete require.cache[input];

		return config;
	}
}


// copied from https://github.com/rollup/rollup/blob/master/cli/logging.ts
// and updated so that it will compile here

export function handleError(err: RollupError, recover = false) {
	let description = err.message || err;
	if (err.name) description = `${err.name}: ${description}`;
	const message =
		(err.plugin
			? `(plugin ${(err).plugin}) ${description}`
			: description) || err;

	stderr(color.bold().red(`[!] ${color.bold(message.toString())}`));

	if (err.url) {
		stderr(color.cyan(err.url));
	}

	if (err.loc) {
		stderr(`${err.loc.file || err.id} (${err.loc.line}:${err.loc.column})`);
	} else if (err.id) {
		stderr(err.id);
	}

	if (err.frame) {
		stderr(color.dim(err.frame));
	}

	if (err.stack) {
		stderr(color.dim(err.stack));
	}

	stderr('');

	if (!recover) process.exit(1);
}
