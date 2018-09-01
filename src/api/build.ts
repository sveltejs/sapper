import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { EventEmitter } from 'events';
import * as codec from 'sourcemap-codec';
import minify_html from './utils/minify_html';
import { create_compilers, create_main_manifests, create_routes, create_serviceworker_manifest } from '../core';
import * as events from './interfaces';
import { copy_shimport } from './utils/copy_shimport';
import { Dirs, PageComponent } from '../interfaces';
import { CompileResult } from '../core/create_compilers';

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
	const css_map = new Map();
	client_result.css_files.forEach(css => {
		css_map.set(css.id, css.code);
	});

	client_result.chunks.forEach(chunk => {
		const parts: string[] = [];
		const mappings: number[][][] = [];

		const output_file_name = chunk.file.replace(/\.js$/, '.css');

		const combined_map: SourceMap = {
			version: 3,
			file: output_file_name,
			sources: [],
			sourcesContent: [],
			names: [],
			mappings: null
		};

		let num_lines = 0;

		chunk.modules.forEach(module => {
			if (!/\.css$/.test(module)) return;

			const css = css_map.get(module);

			const { code, map } = extract_sourcemap(css, module);

			parts.push(code);

			if (map) {
				const lines = codec.decode(map.mappings);

				lines.forEach(line => {
					line.forEach(segment => {
						segment[1] += map.sources.length;
						segment[2] += num_lines;
						if (segment[4]) segment[4] += map.names.length;
					});
				});

				combined_map.sources.push(...map.sources);
				combined_map.sourcesContent.push(...map.sourcesContent);
				combined_map.names.push(...map.names);

				mappings.push(...lines);
			}

			num_lines += code.split('\n').length;
		});

		if (parts.length > 0) {
			combined_map.mappings = codec.encode(mappings);

			combined_map.sources = combined_map.sources.map(source => path.relative(`${dirs.dest}/client`, source));

			parts.push(`/*# sourceMappingURL=${output_file_name}.map */`);
			const code = parts.join('\n');

			fs.writeFileSync(`${dirs.dest}/client/${output_file_name}`, parts.join('\n'));
			fs.writeFileSync(`${dirs.dest}/client/${output_file_name}.map`, JSON.stringify(combined_map, null, '  '));
		}
	});

	const component_owners = new Map();
	client_result.chunks.forEach(chunk => {
		chunk.modules.forEach(module => {
			const component = path.relative(dirs.routes, module);
			component_owners.set(component, chunk);
		});
	});

	const chunk_map = new Map();
	client_result.chunks.forEach(chunk => {
		chunk_map.set(chunk.file, chunk);
	});

	const main = client_result.assets.main;
	const entry = fs.readFileSync(`${dirs.dest}/client/${main}`, 'utf-8');

	const replacements = new Map();

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

		replacements.set(
			component.file,
			Array.from(chunks).map(chunk => chunk.file.replace(/\.js$/, '.css'))
		);
	});

	const replaced = entry.replace(/["']__SAPPER_CSS_PLACEHOLDER:(.+?)__["']/g, (m, route) => {
		return JSON.stringify(replacements.get(route));
	});

	fs.writeFileSync(`${dirs.dest}/client/${main}`, replaced);
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

	extract_css(client_result, routes.components, dirs);

	const build_info: {
		bundler: string;
		shimport: string;
		assets: Record<string, string>;
		legacy_assets?: Record<string, string>;
	} = {
		bundler: opts.bundler,
		shimport: opts.bundler === 'rollup' && require('shimport/package.json').version,
		assets: client_result.assets
	};

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