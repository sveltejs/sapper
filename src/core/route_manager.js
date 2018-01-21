import glob from 'glob';
import create_routes from './utils/create_routes.js';

export let routes;

export function update({ src }) {
	routes = create_routes(
		glob.sync('**/*.+(html|js|mjs)', { cwd: src })
	);

	return routes;
}