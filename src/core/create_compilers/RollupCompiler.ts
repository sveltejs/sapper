import * as path from 'path';
import color from 'kleur';
import relative from 'require-relative';
import {
	InputOption,
	InputOptions,
	PluginContext,
	TransformResult,
	NormalizedInputOptions,
	NormalizedOutputOptions,
	RenderedChunk,
	RollupError,
	OutputBundle,
	OutputChunk
} from 'rollup';
import { ChunkResolver } from './chunk';
import { chunk_content_from_modules, extract_sourcemap, emit_code_and_sourcemap } from './code';
import { CompileResult } from './interfaces';
import RollupResult from './RollupResult';

const stderr = console.error.bind(console);

let rollup: any;

const get_entry_point_output_chunk = (bundle: OutputBundle, entry_point?: string) => {
	if (entry_point === undefined) {
		throw new Error("Internal error: entry_point cannot be undefined");
	}

	let entry_point_output_chunk: OutputChunk;
	for (const chunk of Object.values(bundle)) {
		if ((chunk as OutputChunk).facadeModuleId === entry_point) {
			entry_point_output_chunk = chunk as OutputChunk;
		}
	}

	if (!entry_point_output_chunk) {
		throw new Error(`Internal error: No chunk for entry point: ${entry_point} in: ${Object.keys(bundle)}`);
	}

	if (entry_point_output_chunk.type !== 'chunk') {
		throw new Error(`Internal error: Wrong type for entry point chunk: ${entry_point} in: ${Object.keys(bundle)}`);
	}

	return entry_point_output_chunk;
};

export default class RollupCompiler {
	_: Promise<any>;
	_oninvalid: (filename: string) => void;
	_start: number;
	input: InputOption;
	warnings: any[];
	errors: any[];
	chunks: any[];
	css_files: Array<{ id: string; code: string }>;
	dependencies: Record<string, string[]>;

	constructor(config: any) {
		this._ = this.get_config(config);
		this.input = null;
		this.warnings = [];
		this.errors = [];
		this.chunks = [];
		this.css_files = [];
		this.dependencies = {};
	}

	async get_config(mod: any) {
		let entry_point: string | undefined;

		const that = this;
		const sourcemap = mod.output.sourcemap;

		// TODO this is hacky, and doesn't need to apply to all three compilers
		(mod.plugins || (mod.plugins = [])).push({
			name: 'sapper-internal',
			options(opts: InputOptions) {
				that.input = opts.input;
			},
			buildStart(this: PluginContext, options: NormalizedInputOptions): void {
				const input = options.input;
				const inputs: Array<{alias: string, file: string}> = [];
		
				if (typeof input === 'string') {
					inputs.push({alias: 'main', file: input});
				} else if (Array.isArray(input)) {
					inputs.push(...input.map(file => ({file, alias: file})));
				} else {
					for (const alias in input) {
						inputs.push({file: input[alias], alias});
					}
				}
				if (!entry_point) {
					entry_point = inputs[0].file;
				}
			},
			renderChunk(code: string, chunk: RenderedChunk) {	
				that.chunks.push(chunk);
			},
			transform(code: string, id: string): TransformResult {
				// TODO: see if we can remove after release of https://github.com/sveltejs/rollup-plugin-svelte/pull/72
				if (/\.css$/.test(id)) {
					that.css_files.push({ id, code });
					return {code: '', moduleSideEffects: 'no-treeshake'};
				}
			},
			async generateBundle(this: PluginContext, options: NormalizedOutputOptions, bundle: OutputBundle): Promise<void> {
				const entry_point_output_chunk = get_entry_point_output_chunk(bundle, entry_point);

				const chunk_resolver = new ChunkResolver<OutputChunk>({
					id: chunk => chunk.fileName,
					resolve_id: chunk_file => {
						const oc = bundle[chunk_file];
						return oc && oc.type === 'chunk' ? oc : undefined;
					},
					internals: chunk => ({
						id: chunk.fileName,
						facadeId: chunk.facadeModuleId,
						name: chunk.name,
						file_name: chunk.fileName,
						dep_names: chunk === entry_point_output_chunk ? [...chunk.imports] : [...chunk.imports, ...chunk.dynamicImports],
						manifest: Object.keys(chunk.modules),
						type: options.format === 'es' ? 'module' : 'script'
					}),
					module_imports: js_module => {
						const module_info = this.getModuleInfo(js_module);
						return [
							...module_info.importedIds,
							...module_info.dynamicallyImportedIds
						].filter(id => /\.css$/.test(id));
					},
					chunks_from_modules: (chunk, css_modules) => {
						const name = chunk.name + '.css';
						const file_name = emit_code_and_sourcemap({
							sourcemap,
							output: chunk_content_from_modules(
								css_modules,
								css_module => {
									const f = that.css_files.find(file => file.id === css_module);
									return f && extract_sourcemap(f.code, css_module);
								}
							),
							sourcemap_url_prefix: '',
							output_file_name: name,
							emit: (filename: string, source: string | Uint8Array) => {
								const moduleid = this.emitFile({ name: filename, type: 'asset', source });
								const file = this.getFileName(moduleid);
								return file;
							}
						});
		
						return [{
							id: file_name,
							facadeId: chunk.facadeModuleId,
							name,
							file_name,
							manifest: css_modules,
							dep_names: []
						}];
					}
				});

				const output_chunks = Object.values(bundle).filter(output => output.type === 'chunk') as OutputChunk[];
				const chunks = await Promise.all(output_chunks.map(chunk => chunk_resolver.resolve_chunk(chunk)));
				const dependencies = {};
				for (const chunk of chunks) {
					if (chunk.facadeId) {
						dependencies[chunk.facadeId] = Array.from(chunk.transitive_deps).map(dep => dep.file_name);
					}
				}
				that.dependencies = dependencies;
			}
		});

		const onwarn = mod.onwarn || ((warning: any, handler: (warning: any) => void) => {
			handler(warning);
		});

		mod.onwarn = (warning: any) => {
			onwarn(warning, (warn: any) => {
				this.warnings.push(warn);
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

		const config: any = require(input).default; // eslint-disable-line
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
