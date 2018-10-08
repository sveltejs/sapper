import * as fs from 'fs';
import * as path from 'path';
import { Page, PageComponent, ServerRoute, ManifestData } from '../interfaces';
import { posixify, reserved_words } from '../utils';

export default function create_manifest_data(cwd: string): ManifestData {
	// TODO remove in a future version
	if (!fs.existsSync(cwd)) {
		throw new Error(`As of Sapper 0.21, the routes/ directory should become src/routes/`);
	}

	const components: PageComponent[] = [];
	const pages: Page[] = [];
	const server_routes: ServerRoute[] = [];

	const default_layout: PageComponent = {
		default: true,
		name: '_default_layout',
		file: null
	};

	function walk(
		dir: string,
		parent_segments: Part[][],
		parent_params: string[],
		stack: Array<{
			component: PageComponent,
			params: string[]
		}>
	) {
		const items = fs.readdirSync(dir)
			.map(basename => {
				const resolved = path.join(dir, basename);
				const file = path.relative(cwd, resolved);
				const is_dir = fs.statSync(resolved).isDirectory();

				const ext = path.extname(basename);
				if (!is_dir && !/^\.[a-z]+$/i.test(ext)) return null; // filter out tmp files etc

				const segment = is_dir
					? basename
					: basename.slice(0, -path.extname(basename).length);

				const parts = get_parts(segment);
				const is_index = is_dir ? false : basename.startsWith('index.');
				const is_page = ext === '.html';

				parts.forEach(part => {
					if (/\]\[/.test(part.content)) {
						throw new Error(`Invalid route ${file} — parameters must be separated`);
					}

					if (part.qualifier && /[\(\)\?\:]/.test(part.qualifier.slice(1, -1))) {
						throw new Error(`Invalid route ${file} — cannot use (, ), ? or : in route qualifiers`);
					}
				});

				return {
					basename,
					parts,
					file: posixify(file),
					is_dir,
					is_index,
					is_page
				};
			})
			.filter(Boolean)
			.sort(comparator);

		items.forEach(item => {
			if (item.basename[0] === '_') return;

			if (item.basename[0] === '.') {
				if (item.file !== '.well-known') return;
			}

			const segments = parent_segments.slice();

			if (item.is_index && segments.length > 0) {
				const last_segment = segments[segments.length - 1].slice();
				const suffix = item.basename
					.slice(0, -path.extname(item.basename).length).
					replace('index', '');

				if (suffix) {
					const last_part = last_segment[last_segment.length - 1];
					if (last_part.dynamic) {
						last_segment.push({ dynamic: false, content: suffix });
					} else {
						last_segment[last_segment.length - 1] = {
							dynamic: false,
							content: `${last_part.content}${suffix}`
						};
					}

					segments[segments.length - 1] = last_segment;
				}
			} else {
				segments.push(item.parts);
			}

			const params = parent_params.slice();
			params.push(...item.parts.filter(p => p.dynamic).map(p => p.content));

			if (item.is_dir) {
				const index = path.join(dir, item.basename, '_layout.html');

				const component = fs.existsSync(index) && {
					name: `${get_slug(item.file)}__layout`,
					file: `${item.file}/_layout.html`
				};

				if (component) components.push(component);

				walk(
					path.join(dir, item.basename),
					segments,
					params,
					component
						? stack.concat({ component, params })
						: stack.concat(null)
				);
			}

			else if (item.is_page) {
				const component = {
					name: get_slug(item.file),
					file: item.file
				};

				const parts = stack.concat({
					component,
					params
				});

				components.push(component);
				if (item.basename === 'index.html') {
					pages.push({
						pattern: get_pattern(parent_segments, true),
						parts
					});
				} else {
					pages.push({
						pattern: get_pattern(segments, true),
						parts
					});
				}
			}

			else {
				server_routes.push({
					name: `route_${get_slug(item.file)}`,
					pattern: get_pattern(segments, false),
					file: item.file,
					params: params
				});
			}
		});
	}

	const root_file = path.join(cwd, '_layout.html');
	const root = fs.existsSync(root_file)
		? {
			name: 'main',
			file: '_layout.html'
		}
		: default_layout;

	walk(cwd, [], [], []);

	// check for clashes
	const seen_pages: Map<string, Page> = new Map();
	pages.forEach(page => {
		const pattern = page.pattern.toString();
		if (seen_pages.has(pattern)) {
			const file = page.parts.pop().component.file;
			const other_page = seen_pages.get(pattern);
			const other_file = other_page.parts.pop().component.file;

			throw new Error(`The ${other_file} and ${file} pages clash`);
		}

		seen_pages.set(pattern, page);
	});

	const seen_routes: Map<string, ServerRoute> = new Map();
	server_routes.forEach(route => {
		const pattern = route.pattern.toString();
		if (seen_routes.has(pattern)) {
			const other_route = seen_routes.get(pattern);
			throw new Error(`The ${other_route.file} and ${route.file} routes clash`);
		}

		seen_routes.set(pattern, route);
	});

	return {
		root,
		components,
		pages,
		server_routes
	};
}

type Part = {
	content: string;
	dynamic: boolean;
	qualifier?: string;
};

function comparator(
	a: { basename: string, parts: Part[], file: string, is_index: boolean },
	b: { basename: string, parts: Part[], file: string, is_index: boolean }
) {
	if (a.is_index !== b.is_index) return a.is_index ? -1 : 1;

	const max = Math.max(a.parts.length, b.parts.length);

	for (let i = 0; i < max; i += 1) {
		const a_sub_part = a.parts[i];
		const b_sub_part = b.parts[i];

		if (!a_sub_part) return 1; // b is more specific, so goes first
		if (!b_sub_part) return -1;

		if (a_sub_part.dynamic !== b_sub_part.dynamic) {
			return a_sub_part.dynamic ? 1 : -1;
		}

		if (!a_sub_part.dynamic && a_sub_part.content !== b_sub_part.content) {
			return (
				(b_sub_part.content.length - a_sub_part.content.length) ||
				(a_sub_part.content < b_sub_part.content ? -1 : 1)
			);
		}

		// If both parts dynamic, check for regexp patterns
		if (a_sub_part.dynamic && b_sub_part.dynamic) {
			const regexp_pattern = /\((.*?)\)/;
			const a_match = regexp_pattern.exec(a_sub_part.content);
			const b_match = regexp_pattern.exec(b_sub_part.content);

			if (!a_match && b_match) {
				return 1; // No regexp, so less specific than b
			}
			if (!b_match && a_match) {
				return -1;
			}
			if (a_match && b_match && a_match[1] !== b_match[1]) {
				return b_match[1].length - a_match[1].length;
			}
		}
	}
}

function get_parts(part: string): Part[] {
	return part.split(/\[(.+)\]/)
		.map((str, i) => {
			if (!str) return null;
			const dynamic = i % 2 === 1;

			const [, content, qualifier] = dynamic
				? /([^(]+)(\(.+\))?$/.exec(str)
				: [, str, null];

			return {
				content,
				dynamic,
				qualifier
			};
		})
		.filter(Boolean);
}

function get_slug(file: string) {
	let name = file
		.replace(/[\\\/]index/, '')
		.replace(/_default([\/\\index])?\.html$/, 'index')
		.replace(/[\/\\]/g, '_')
		.replace(/\.\w+$/, '')
		.replace(/\[([^(]+)(?:\([^(]+\))?\]/, '$$$1')
		.replace(/[^a-zA-Z0-9_$]/g, c => {
			return c === '.' ? '_' : `$${c.charCodeAt(0)}`
		});

	if (reserved_words.has(name)) name += '_';
	return name;
}

function get_pattern(segments: Part[][], add_trailing_slash: boolean) {
	return new RegExp(
		`^` +
		segments.map(segment => {
			return '\\/' + segment.map(part => {
				return part.dynamic
					? part.qualifier || '([^\\/]+?)'
					: encodeURI(part.content.normalize())
						.replace(/\?/g, '%3F')
						.replace(/#/g, '%23')
						.replace(/%5B/g, '[')
						.replace(/%5D/g, ']');
			}).join('');
		}).join('') +
		(add_trailing_slash ? '\\\/?$' : '$')
	);
}