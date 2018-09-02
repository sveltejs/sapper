import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { EventEmitter } from 'events';
import * as codec from 'sourcemap-codec';
import hash from 'string-hash';
import minify_html from './utils/minify_html';
import { create_compilers, create_main_manifests, create_routes, create_serviceworker_manifest } from '../core';
import * as events from './interfaces';
import { copy_shimport } from './utils/copy_shimport';
import { Dirs, PageComponent } from '../interfaces';
import { CompileResult } from '../core/create_compilers/interfaces';

type Opts = {
	legacy: boolean;
	bundler: string;
};

export function build(opts: Opts, dirs: Dirs) {
	const emitter = new EventEmitter();

	execute(emitter, opts, dirs).then(
		() => {
			emitter.emit('done', <events.DoneEvent>{}); // TODO do we need to pass back any info?
		},
		error => {
			emitter.emit('error', <events.ErrorEvent>{
				error
			});
		}
	);

	return emitter;
}

const inline_sourcemap_header = 'data:application/json;charset=utf-8;base64,';

function extract_sourcemap(raw: string, id: string) {
	let raw_map: string;
	let map = null;

	const code = raw.replace(/\/\*#\s+sourceMappingURL=(.+)\s+\*\//g, (m, url) => {
		if (raw_map) {
			// TODO should not happen!
			throw new Error(`Found multiple sourcemaps in single CSS file (${id})`);
		}

		raw_map = url;
		return '';
	}).trim();

	if (raw_map) {
		if (raw_map.startsWith(inline_sourcemap_header)) {
			const json = Buffer.from(raw_map.slice(inline_sourcemap_header.length), 'base64').toString();
			map = JSON.parse(json);
		} else {
			// TODO do we want to handle non-inline sourcemaps? could be a rabbit hole
		}
	}

	return {
		code,
		map
	};
}

type SourceMap = {
	version: 3;
	file: string;
	sources: string[];
	sourcesContent: string[];
	names: string[];
	mappings: string;
};

function extract_css(client_result: CompileResult, components: PageComponent[], dirs: Dirs) {
	const result: {
		main: string | null;
		chunks: Record<string, string[]>
	} = {
		main: null,
		chunks: {}
	};

	if (!client_result.css_files) return; // Rollup-only for now

	const unaccounted_for = new Set();

	const css_map = new Map();
	client_result.css_files.forEach(css => {
		unaccounted_for.add(css.id);
		css_map.set(css.id, css.code);
	});

	const chunk_map = new Map();
	client_result.chunks.forEach(chunk => {
		chunk_map.set(chunk.file, chunk);
	});

	const chunks_with_css = new Set();

	// figure out which chunks belong to which components...
	const component_owners = new Map();
	client_result.chunks.forEach(chunk => {
		chunk.modules.forEach(module => {
			const component = path.relative(dirs.routes, module);
			component_owners.set(component, chunk);
		});
	});

	const chunks_depended_upon_by_component = new Map();

	// ...so we can figure out which chunks don't belong
	components.forEach(component => {
		const chunk = component_owners.get(component.file);
		if (!chunk) {
			// this should never happen!
			throw new Error(`Could not find chunk that owns ${component.file}`);
		}

		const chunks = new Set([chunk]);
		chunks.forEach(chunk => {
			chunk.imports.forEach((file: string) => {
				const chunk = chunk_map.get(file);
				if (chunk) chunks.add(chunk);
			});
		});

		chunks.forEach(chunk => {
			chunk.modules.forEach((module: string) => {
				unaccounted_for.delete(module);
			});
		});

		chunks_depended_upon_by_component.set(
			component,
			chunks
		);
	});

	function get_css_from_modules(modules: string[]) {
		const parts: string[] = [];
		const mappings: number[][][] = [];

		const combined_map: SourceMap = {
			version: 3,
			file: null,
			sources: [],
			sourcesContent: [],
			names: [],
			mappings: null
		};

		modules.forEach(module => {
			if (!/\.css$/.test(module)) return;

			const css = css_map.get(module);

			const { code, map } = extract_sourcemap(css, module);

			parts.push(code);

			if (map) {
				const lines = codec.decode(map.mappings);

				if (combined_map.sources.length > 0 || combined_map.names.length > 0) {
					lines.forEach(line => {
						line.forEach(segment => {
							// adjust source index
							segment[1] += combined_map.sources.length;

							// adjust name index
							if (segment[4]) segment[4] += combined_map.names.length;
						});
					});
				}

				combined_map.sources.push(...map.sources);
				combined_map.sourcesContent.push(...map.sourcesContent);
				combined_map.names.push(...map.names);

				mappings.push(...lines);
			}
		});

		if (parts.length > 0) {
			combined_map.mappings = codec.encode(mappings);

			combined_map.sources = combined_map.sources.map(source => path.relative(`${dirs.dest}/client`, source));

			return {
				code: parts.join('\n'),
				map: combined_map
			};
		}

		return null;
	}

	const main = client_result.assets.main;
	const entry = fs.readFileSync(`${dirs.dest}/client/${main}`, 'utf-8');

	const replacements = new Map();

	chunks_depended_upon_by_component.forEach((chunks, component) => {
		const chunks_with_css = Array.from(chunks).filter(chunk => {
			const css = get_css_from_modules(chunk.modules);

			if (css) {
				const { code, map } = css;

				const output_file_name = chunk.file.replace(/\.js$/, '.css');

				map.file = output_file_name;
				map.sources = map.sources.map(source => path.relative(`${dirs.dest}/client`, source));

				fs.writeFileSync(`${dirs.dest}/client/${output_file_name}`, `${code}\n/* sourceMappingURL=client/${output_file_name}.map */`);
				fs.writeFileSync(`${dirs.dest}/client/${output_file_name}.map`, JSON.stringify(map, null, '  '));

				return true;
			}
		});

		const files = chunks_with_css.map(chunk => chunk.file.replace(/\.js$/, '.css'));

		replacements.set(
			component.file,
			files
		);

		result.chunks[component.file] = files;
	});

	const replaced = entry.replace(/["']__SAPPER_CSS_PLACEHOLDER:(.+?)__["']/g, (m, route) => {
		return JSON.stringify(replacements.get(route));
	});

	fs.writeFileSync(`${dirs.dest}/client/${main}`, replaced);

	const leftover = get_css_from_modules(Array.from(unaccounted_for));
	if (leftover) {
		const { code, map } = leftover;

		const main_hash = hash(code);

		const output_file_name = `main.${main_hash}.css`;

		map.file = output_file_name;
		map.sources = map.sources.map(source => path.relative(`${dirs.dest}/client`, source));

		fs.writeFileSync(`${dirs.dest}/client/${output_file_name}`, `${code}\n/* sourceMappingURL=client/${output_file_name}.map */`);
		fs.writeFileSync(`${dirs.dest}/client/${output_file_name}.map`, JSON.stringify(map, null, '  '));

		result.main = output_file_name;
	}

	return result;
}

async function execute(emitter: EventEmitter, opts: Opts, dirs: Dirs) {
	rimraf.sync(path.join(dirs.dest, '**/*'));
	mkdirp.sync(`${dirs.dest}/client`);
	copy_shimport(dirs.dest);

	// minify app/template.html
	// TODO compile this to a function? could be quicker than str.replace(...).replace(...).replace(...)
	const template = fs.readFileSync(`${dirs.app}/template.html`, 'utf-8');

	// remove this in a future version
	if (template.indexOf('%sapper.base%') === -1) {
		const error = new Error(`As of Sapper v0.10, your template.html file must include %sapper.base% in the <head>`);
		error.code = `missing-sapper-base`;
		throw error;
	}

	fs.writeFileSync(`${dirs.dest}/template.html`, minify_html(template));

	const routes = create_routes();

	// create app/manifest/client.js and app/manifest/server.js
	create_main_manifests({ bundler: opts.bundler, routes });

	const { client, server, serviceworker } = create_compilers(opts.bundler, dirs);

	const client_result = await client.compile();
	emitter.emit('build', <events.BuildEvent>{
		type: 'client',
		// TODO duration/warnings
		result: client_result
	});

	// TODO as much of this into the compiler facade as possible
	const css = extract_css(client_result, routes.components, dirs);

	const build_info = client_result.to_json();

	if (opts.legacy) {
		process.env.SAPPER_LEGACY_BUILD = 'true';
		const { client } = create_compilers(opts.bundler, dirs);

		const client_result = await client.compile();

		emitter.emit('build', <events.BuildEvent>{
			type: 'client (legacy)',
			// TODO duration/warnings
			result: client_result
		});

		build_info.legacy_assets = client_result.assets;
		delete process.env.SAPPER_LEGACY_BUILD;
	}

	fs.writeFileSync(path.join(dirs.dest, 'build.json'), JSON.stringify(build_info));

	const server_stats = await server.compile();
	emitter.emit('build', <events.BuildEvent>{
		type: 'server',
		// TODO duration/warnings
		result: server_stats
	});

	let serviceworker_stats;

	if (serviceworker) {
		create_serviceworker_manifest({
			routes,
			client_files: client_result.chunks.map(chunk => `client/${chunk.file}`)
		});

		serviceworker_stats = await serviceworker.compile();

		emitter.emit('build', <events.BuildEvent>{
			type: 'serviceworker',
			// TODO duration/warnings
			result: serviceworker_stats
		});
	}
}