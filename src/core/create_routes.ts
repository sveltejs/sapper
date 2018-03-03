import * as path from 'path';
import glob from 'glob';
import { src } from '../config';
import { Route } from '../interfaces';

export default function create_routes({ files } = { files: glob.sync('**/*.+(html|js|mjs)', { cwd: src() }) }) {
	const routes: Route[] = files
		.map((file: string) => {
			if (/(^|\/|\\)_/.test(file)) return;

			if (/]\[/.test(file)) {
				throw new Error(`Invalid route ${file} — parameters must be separated`);
			}

			const base = file.replace(/\.[^/.]+$/, '');
			const parts = base.split('/'); // glob output is always posix-style
			if (parts[parts.length - 1] === 'index') parts.pop();

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
				const part = parts[i];
				const dynamic = part[0] === '[';

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
				type: path.extname(file) === '.html' ? 'page' : 'route',
				file,
				pattern,
				test,
				exec,
				parts,
				params
			};
		})
		.filter(Boolean)
		.sort((a: Route, b: Route) => {
			let same = true;

			for (let i = 0; true; i += 1) {
				const a_part = a.parts[i];
				const b_part = b.parts[i];

				if (!a_part && !b_part) {
					if (same) throw new Error(`The ${a.file} and ${b.file} routes clash`);
					return 0;
				}

				if (!a_part) return -1;
				if (!b_part) return 1;

				const a_sub_parts = get_sub_parts(a_part);
				const b_sub_parts = get_sub_parts(b_part);

				for (let i = 0; true; i += 1) {
					const a_sub_part = a_sub_parts[i];
					const b_sub_part = b_sub_parts[i];

					if (!a_sub_part && !b_sub_part) break;

					if (!a_sub_part) return 1; // note this is reversed from above — match [foo].json before [foo]
					if (!b_sub_part) return -1;

					if (a_sub_part.dynamic !== b_sub_part.dynamic) {
						return a_sub_part.dynamic ? 1 : -1;
					}

					if (!a_sub_part.dynamic && a_sub_part.content !== b_sub_part.content) {
						return b_sub_part.content.length - a_sub_part.content.length;
					}
				}
			}
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