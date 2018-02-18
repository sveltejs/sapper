import * as path from 'path';
import glob from 'glob';
import { Route } from '../interfaces';

export default function create_routes({ src, files = glob.sync('**/*.+(html|js|mjs)', { cwd: src }) }: {
	src: string;
	files?: string[];
}) {
	const routes: Route[] = files
		.map((file: string) => {
			if (/(^|\/|\\)_/.test(file)) return;

			const parts = file.replace(/\.(html|js|mjs)$/, '').split('/'); // glob output is always posix-style
			if (parts[parts.length - 1] === 'index') parts.pop();

			const id = (
				parts.join('_').replace(/[[\]]/g, '$').replace(/^\d/, '_$&').replace(/[^a-zA-Z0-9_$]/g, '_')
			 ) || '_';

			const dynamic = parts
				.filter(part => part[0] === '[')
				.map(part => part.slice(1, -1));

			let pattern_string = '';
			let i = parts.length;
			let nested = true;
			while (i--) {
				const part = parts[i];
				const dynamic = part[0] === '[';

				if (dynamic) {
					pattern_string = nested ? `(?:\\/([^/]+)${pattern_string})?` : `\\/([^/]+)${pattern_string}`;
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

				const params: Record<string, string> = {};
				dynamic.forEach((param, i) => {
					params[param] = match[i + 1];
				});

				return params;
			};

			return {
				id,
				type: path.extname(file) === '.html' ? 'page' : 'route',
				file,
				pattern,
				test,
				exec,
				parts,
				dynamic
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

				const a_is_dynamic = a_part[0] === '[';
				const b_is_dynamic = b_part[0] === '[';

				if (a_is_dynamic === b_is_dynamic) {
					if (!a_is_dynamic && a_part !== b_part) same = false;
					continue;
				}

				return a_is_dynamic ? 1 : -1;
			}
		});

	return routes;
}