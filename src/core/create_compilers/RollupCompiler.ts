import * as path from 'path';
import color from 'kleur';
import relative from 'require-relative';
import { dependenciesForTree, DependencyTreeOptions } from 'rollup-dependency-tree';
import {
	PluginContext,
	TransformResult,
	NormalizedInputOptions,
	NormalizedOutputOptions,
	RenderedChunk,
	RollupError,
	OutputBundle,
	OutputChunk
} from 'rollup';
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
	js_main: string | null;
	css_main: string[];
	warnings: any[];
	errors: any[];
	chunks: RenderedChunk[];
	css_files: Record<string, string>;
	dependencies: Record<string, string[]>;
	routes: string;

	constructor(config: any, routes: string) {
		this._ = this.get_config(config);
		this.js_main = null;
		this.css_main = [];
		this.warnings = [];
		this.errors = [];
		this.chunks = [];
		this.css_files = {};
		this.dependencies = {};
		this.routes = routes;
	}

	async get_config(mod: any) {
		let entry_point: string | undefined;

		const that = this;
		const sourcemap = mod.output.sourcemap;

		// TODO this is hacky, and doesn't need to apply to all three compilers
		(mod.plugins || (mod.plugins = [])).push({
			name: 'sapper-internal',
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
				// rollup-plugin-svelte adds an import statement to the js file which references the css file
				// that won't be able to be compiled as js, so we remove it here and store a copy to use later
				if (/\.css$/.test(id)) {
					that.css_files[id] = code;
					return {code: '', moduleSideEffects: 'no-treeshake'};
				}
			},
			async generateBundle(this: PluginContext, options: NormalizedOutputOptions, bundle: OutputBundle): Promise<void> {
				const create_chunk_from_modules = (entry_chunk_name: string, css_modules: Iterable<string>) => {
					const name = entry_chunk_name + '.css';
					const file_name = emit_code_and_sourcemap({
						sourcemap,
						output: chunk_content_from_modules(
							css_modules,
							css_module => {
								const code = that.css_files[css_module];
								return code && extract_sourcemap(code, css_module);
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
					return file_name;
				};

				function js_deps(chunk: RenderedChunk, opts?: DependencyTreeOptions) {
					return Array.from(dependenciesForTree(chunk, that.chunks, opts));
				}

				function css_deps(transitive_deps: string[]) {
					const result: Set<string> = new Set();
					for (const dep of transitive_deps) {
						const css_chunk = css_for_chunk[dep];
						if (css_chunk) {
							result.add(css_chunk);
						}
					}
					return Array.from(result);
				}

				const css_for_chunk = {};
				const processed_chunks: Set<RenderedChunk> = new Set();

				/**
				 * Creates a single CSS chunk for the given JS chunks
				 */
				function handle_chunks(tree_entry_chunk: RenderedChunk, chunks: Iterable<RenderedChunk>) {
					const css_modules: Set<string> = new Set();
					for (const chunk of chunks) {
						processed_chunks.add(chunk);
						Object.keys(chunk.modules).filter(k => k.endsWith('.css')).forEach(m => css_modules.add(m));
					}
					if (css_modules.size) {
						css_for_chunk[tree_entry_chunk.fileName] = create_chunk_from_modules(tree_entry_chunk.name, css_modules);
					}
				}

				/**
				 * Creates CSS chunks for the given JS chunk and its dependencies
				 */
				function handle_chunk_tree(tree_entry_chunk: RenderedChunk, subtree?: boolean) {
					// We need to avoid the entry chunk both here and below so that we don't walk everything
					// We should remove the ciricular dependency in Sapper so that this isn't a concern
					const transitive_deps = js_deps(tree_entry_chunk, {
						filter: ctx => ctx.chunk.fileName !== tree_entry_chunk.fileName,
						walk: ctx => !ctx.dynamicImport && ctx.chunk.fileName != entry_chunk.fileName });
					for (const chunk of transitive_deps) {
						if (!processed_chunks.has(chunk)) {
							handle_chunks(chunk, [chunk]);
						}
					}

					// Put everything that's leftover into the entry chunk in order to include css
					// that is in a dynamically imported chunk
					const chunks_for_tree = js_deps(tree_entry_chunk,
						{ walk: ctx => !subtree || ctx.chunk.fileName != entry_chunk.fileName });
					const unused = new Set(chunks_for_tree.filter(x => !processed_chunks.has(x)));
					handle_chunks(tree_entry_chunk, unused);
				}

				function get_route_entry_chunks(main_entry_chunk: RenderedChunk) {
					return js_deps(main_entry_chunk, { filter: ctx => ctx.dynamicImport
						&& ctx.chunk.facadeModuleId
						&& ctx.chunk.facadeModuleId.includes(that.routes)
						&& !ctx.chunk.facadeModuleId.includes(path.sep + '_') });
				}

				// Create the CSS chunks. Start with the routes. Put the leftover in the entry
				// chunk to handle dynamic imports in the layout
				const entry_chunk = get_entry_point_output_chunk(bundle, entry_point);
				const route_entry_chunks = get_route_entry_chunks(entry_chunk);
				for (const route_entry_chunk of route_entry_chunks) {
					handle_chunk_tree(route_entry_chunk, true);
				}
				handle_chunk_tree(entry_chunk);

				// Store the build dependencies so that we can create build.json
				const dependencies = {};

				// We need to handle the entry point separately
				// If there's a single page and preserveEntrySignatures is false then Rollup will
				// put everything in the entry point chunk (client.hash.js)
				// In that case we can't look it up by route, but still want to include it
				that.js_main = entry_chunk.fileName;
				const entry_deps = js_deps(entry_chunk,
					{ walk: ctx => !ctx.dynamicImport, filter: ctx => ctx.chunk.fileName !== entry_chunk.fileName }
					).map(c => c.fileName);
				dependencies[entry_chunk.facadeModuleId] = entry_deps;

				// We consider the dependencies of the entry chunk as well when finding the CSS in
				// case preserveEntrySignatures is true and there are multiple chunks
				that.css_main = css_deps(entry_deps);

				// Routes dependencies
				for (const chunk of route_entry_chunks) {
					const js_dependencies = js_deps(chunk, { walk: ctx => !ctx.dynamicImport }).map(c => c.fileName);
					const css_dependencies = css_deps(js_dependencies);
					dependencies[chunk.facadeModuleId] = [...js_dependencies, ...css_dependencies];
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
