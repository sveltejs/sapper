import * as fs from 'fs';
import * as path from 'path';

export default function inject_resources(
	build_json_file: string,
	asset_dir: string
) {
	const file_contents: string = fs.readFileSync(build_json_file, 'utf8');
	const build = JSON.parse(file_contents);
	const deps = {};
	for (const [key, value] of Object.entries(build.dependencies)) {
		deps[key] = (value as string[]).filter(dep => dep.endsWith('.css'));
	}

	fs.readdirSync(asset_dir).forEach(file => {
		const file_path = path.resolve(asset_dir, file);
		if (!file.endsWith('.js') || fs.statSync(file_path).isDirectory()) return;

		const source = fs.readFileSync(file_path, 'utf-8');

		const replaced = source.replace(/(\\?["'])__SAPPER_CSS_PLACEHOLDER:([^"']+?)__\1/g, (m, quotes, route) => {
			let replacement = JSON.stringify(
				process.env.SAPPER_LEGACY_BUILD && deps[route] ?
					deps[route].map(_ => `legacy/${_}`) :
					deps[route]
			);

			// If the quotation marks are escaped, then
			// the source code is in a string literal
			// (e.g., source maps) rather than raw
			// JavaScript source. We need to stringify
			// again and then remove the extra quotation
			// marks so that replacement is correct.
			if (quotes[0] === '\\') {
				replacement = JSON.stringify(replacement);
				replacement = replacement.substring(1, replacement.length - 1);
			}

			return replacement;
		});

		fs.writeFileSync(file_path, replaced);
	});

}
