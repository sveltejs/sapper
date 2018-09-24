import * as fs from 'fs';
import * as path from 'path';
import hash from 'string-hash';
import * as codec from 'sourcemap-codec';
import { PageComponent, Dirs } from '../../interfaces';
import { CompileResult } from './interfaces';
import { posixify } from '../utils'

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

export default function extract_css(client_result: CompileResult, components: PageComponent[], dirs: Dirs) {
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
			const component = posixify(path.relative(dirs.routes, module));
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

	let main = client_result.assets.main;
	if (process.env.SAPPER_LEGACY_BUILD) main = `legacy/${main}`;
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