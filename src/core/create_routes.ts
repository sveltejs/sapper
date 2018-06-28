import * as path from 'path';
import glob from 'glob';
import { locations } from '../config';
import { Route } from '../interfaces';

export default function create_routes({ files } = { files: glob.sync('**/*.*', { cwd: locations.routes(), dot: true, nodir: true }) }) {
	const routes: Route[] = files
		.filter((file: string) => !/(^|\/|\\)(_(?!error\.html)|\.(?!well-known))/.test(file))
		.map((file: string) => {
			if (/]\[/.test(file)) {
				throw new Error(`Invalid route ${file} — parameters must be separated`);
			}

			if (file === '4xx.html' || file === '5xx.html') {
				throw new Error('As of Sapper 0.14, 4xx.html and 5xx.html should be replaced with _error.html');
			}

			const base = file.replace(/\.[^/.]+$/, '');
			const parts = base.split('/'); // glob output is always posix-style
			if (parts[parts.length - 1] === 'index') parts.pop();

			return {
				files: [file],
				base,
				parts
			};
		})
		.filter(Boolean)
		.filter((a, index, array) => {
			const found = array.slice(index + 1).find(b => a.base === b.base);
			if (found) found.files.push(...a.files);
			return !found;
		})
		.sort((a, b) => {
			if (a.parts[0] === '_error') return -1;
			if (b.parts[0] === '_error') return 1;

			const max = Math.max(a.parts.length, b.parts.length);

			for (let i = 0; i < max; i += 1) {
				const a_part = a.parts[i];
				const b_part = b.parts[i];

				if (!a_part) return -1;
				if (!b_part) return 1;

				const a_sub_parts = get_sub_parts(a_part);
				const b_sub_parts = get_sub_parts(b_part);
				const max = Math.max(a_sub_parts.length, b_sub_parts.length);

				for (let i = 0; i < max; i += 1) {
					const a_sub_part = a_sub_parts[i];
					const b_sub_part = b_sub_parts[i];

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
				}
			}

			throw new Error(`The ${a.base} and ${b.base} routes clash`);
		})
		.map(({ files, base, parts }) => {
			const id = (
				parts.join('_').replace(/[[\]]/g, '$').replace(/^\d/, '_$&').replace(/[^a-zA-Z0-9_$]/g, '_')
			 ) || '_';

			const params: string[] = [];
			const param_pattern = /\[([^\]]+)\]/g;
			let match;
			while (match = param_pattern.exec(base)) {
				params.push(match[1]);
			}

			// TODO can we do all this with sub-parts? or does
			// nesting make that impossible?
			let pattern_string = '';
			let i = parts.length;
			let nested = true;
			while (i--) {
				const part = encodeURI(parts[i].normalize()).replace(/\?/g, '%3F').replace(/#/g, '%23').replace(/%5B/g, '[').replace(/%5D/g, ']');
				const dynamic = ~part.indexOf('[');

				if (dynamic) {
					const matcher = part.replace(param_pattern, `([^\/]+?)`);
					pattern_string = nested ? `(?:\\/${matcher}${pattern_string})?` : `\\/${matcher}${pattern_string}`;
				} else {
					nested = false;
					pattern_string = `\\/${part}${pattern_string}`;
				}
			}

			const pattern = new RegExp(`^${pattern_string}\\/?$`);

			const test = (url: string) => pattern.test(url);

			const exec = (url: string) => {
				const match = pattern.exec(url);
				if (!match) return;

				const result: Record<string, string> = {};
				params.forEach((param, i) => {
					result[param] = match[i + 1];
				});

				return result;
			};

			return {
				id,
				handlers: files.map(file => ({
					type: path.extname(file) === '.html' ? 'page' : 'route',
					file
				})).sort((a, b) => {
					if (a.type === 'page' && b.type === 'route') {
						return 1;
					}

					if (a.type === 'route' && b.type === 'page') {
						return -1;
					}

					return 0;
				}),
				pattern,
				test,
				exec,
				parts,
				params
			};
		});

	return routes;
}

function get_sub_parts(part: string) {
	return part.split(/[\[\]]/)
		.map((content, i) => {
			if (!content) return null;
			return {
				content,
				dynamic: i % 2 === 1
			};
		})
		.filter(Boolean);
}