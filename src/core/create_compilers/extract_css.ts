import * as fs from 'fs';
import * as path from 'path';
import hash from 'string-hash';
import * as codec from 'sourcemap-codec';
import { PageComponent, Dirs } from '../../interfaces';
import { CompileResult, Chunk } from './interfaces';
import { posixify } from '../../utils'

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

function get_css_from_modules(modules: string[], css_map: Map<string, string>, dirs: Dirs) {
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

export default function extract_css(client_result: CompileResult, components: PageComponent[], dirs: Dirs) {
	const result: {
		main: string | null;
		chunks: Record<string, string[]>
	} = {
		main: null,
		chunks: {}
	};

	if (!client_result.css_files) return; // Rollup-only for now

	let asset_dir = `${dirs.dest}/client`;
	if (process.env.SAPPER_LEGACY_BUILD) asset_dir += '/legacy';

	const unclaimed = new Set(client_result.css_files.map(x => x.id));

	const lookup = new Map();
	client_result.chunks.forEach(chunk => {
		lookup.set(chunk.file, chunk);
	});

	const css_map = new Map();
	client_result.css_files.forEach(css_module => {
		css_map.set(css_module.id, css_module.code);
	});

	const chunks_with_css = new Set();

	// concatenate and emit CSS
	client_result.chunks.forEach(chunk => {
		const css_modules = chunk.modules.filter(m => css_map.has(m));
		if (!css_modules.length) return;

		const css = get_css_from_modules(css_modules, css_map, dirs);

		const { code, map } = css;

		const output_file_name = chunk.file.replace(/\.js$/, '.css');

		map.file = output_file_name;
		map.sources = map.sources.map(source => path.relative(`${asset_dir}`, source));

		fs.writeFileSync(`${asset_dir}/${output_file_name}`, `${code}\n/* sourceMappingURL=./${output_file_name}.map */`);
		fs.writeFileSync(`${asset_dir}/${output_file_name}.map`, JSON.stringify(map, null, '  '));

		chunks_with_css.add(chunk);
	});

	const entry = path.resolve(dirs.src, 'client.js');
	const entry_chunk = client_result.chunks.find(chunk => chunk.modules.indexOf(entry) !== -1);

	const entry_chunk_dependencies: Set<Chunk> = new Set([entry_chunk]);
	const entry_css_modules: string[] = [];

	// recursively find the chunks this component depends on
	entry_chunk_dependencies.forEach(chunk => {
		chunk.imports.forEach(file => {
			entry_chunk_dependencies.add(lookup.get(file));
		});

		if (chunks_with_css.has(chunk)) {
			chunk.modules.forEach(file => {
				unclaimed.delete(file);
				if (css_map.has(file)) {
					entry_css_modules.push(file);
				}
			});
		}
	});

	// figure out which (css-having) chunks each component depends on
	components.forEach(component => {
		const resolved = path.resolve(dirs.routes, component.file);
		const chunk: Chunk = client_result.chunks.find(chunk => chunk.modules.indexOf(resolved) !== -1);

		if (!chunk) {
			// this should never happen!
			throw new Error(`Could not find chunk that owns ${component.file}`);
		}

		const chunk_dependencies: Set<Chunk> = new Set([chunk]);
		const css_dependencies: string[] = [];

		// recursively find the chunks this component depends on
		chunk_dependencies.forEach(chunk => {
			chunk.imports.forEach(file => {
				chunk_dependencies.add(lookup.get(file));
			});

			if (chunks_with_css.has(chunk)) {
				css_dependencies.push(chunk.file.replace(/\.js$/, '.css'));

				chunk.modules.forEach(file => {
					unclaimed.delete(file);
				});
			}
		});

		result.chunks[component.file] = css_dependencies;
	});

	fs.readdirSync(asset_dir).forEach(file => {
		if (fs.statSync(`${asset_dir}/${file}`).isDirectory()) return;

		const source = fs.readFileSync(`${asset_dir}/${file}`, 'utf-8');

		const replaced = source.replace(/["']__SAPPER_CSS_PLACEHOLDER:(.+?)__["']/g, (m, route) => {
			return JSON.stringify(result.chunks[route]);
		});

		fs.writeFileSync(`${asset_dir}/${file}`, replaced);
	});

	unclaimed.forEach(file => {
		entry_css_modules.push(file);
	});

	const leftover = get_css_from_modules(entry_css_modules, css_map, dirs);
	if (leftover) {
		const { code, map } = leftover;

		const main_hash = hash(code);

		const output_file_name = `main.${main_hash}.css`;

		map.file = output_file_name;
		map.sources = map.sources.map(source => path.relative(asset_dir, source));

		fs.writeFileSync(`${asset_dir}/${output_file_name}`, `${code}\n/* sourceMappingURL=client/${output_file_name}.map */`);
		fs.writeFileSync(`${asset_dir}/${output_file_name}.map`, JSON.stringify(map, null, '  '));

		result.main = output_file_name;
	}

	return result;
}