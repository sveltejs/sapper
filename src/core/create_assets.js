import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import { create_templates, render } from './templates.js';
import create_routes from './create_routes.js';

function ensure_array(thing) {
	return Array.isArray(thing) ? thing : [thing]; // omg webpack what the HELL are you doing
}

export default function create_assets({ src, dest, dev, client_info, server_info }) {
	create_templates(); // TODO refactor this...

	const main_file = `/client/${ensure_array(client_info.assetsByChunkName.main)[0]}`;

	const chunk_files = client_info.assets.map(chunk => `/client/${chunk.name}`);

	const service_worker = generate_service_worker({ chunk_files, src });
	const index = generate_index(main_file);

	const routes = create_routes({ src });

	if (dev) { // TODO move this into calling code
		fs.writeFileSync(path.join(dest, 'service-worker.js'), service_worker);
		fs.writeFileSync(path.join(dest, 'index.html'), index);
	}

	return {
		client: {
			main_file,
			chunk_files,

			main: read(`${dest}${main_file}`),
			chunks: chunk_files.reduce((lookup, file) => {
				lookup[file] = read(`${dest}${file}`);
				return lookup;
			}, {}),

			// TODO confusing that `routes` refers to an array *and* a lookup
			routes: routes.reduce((lookup, route) => {
				lookup[route.id] = `/client/${ensure_array(client_info.assetsByChunkName[route.id])[0]}`;
				return lookup;
			}, {}),

			index,
			service_worker
		},

		server: {
			entry: path.resolve(dest, 'server', server_info.assetsByChunkName.main)
		},

		service_worker
	};
}

function generate_service_worker({ chunk_files, src }) {
	const assets = glob.sync('**', { cwd: 'assets', nodir: true });

	const routes = create_routes({ src }); // TODO refactor

	const route_code = `[${
		routes
			.filter(route => route.type === 'page')
			.map(route => `{ pattern: ${route.pattern} }`)
			.join(', ')
	}]`;

	return read('templates/service-worker.js')
		.replace(/__timestamp__/g, Date.now())
		.replace(/__assets__/g, JSON.stringify(assets))
		.replace(/__shell__/g, JSON.stringify(chunk_files.concat('/index.html')))
		.replace(/__routes__/g, route_code);
}

function generate_index(main_file) {
	return render(200, {
		styles: '',
		head: '',
		html: '<noscript>Please enable JavaScript!</noscript>',
		main: main_file
	});
}

function read(file) {
	return fs.readFileSync(file, 'utf-8');
}
