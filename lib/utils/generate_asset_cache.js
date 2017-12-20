const fs = require('fs');
const path = require('path');
const glob = require('glob');
const templates = require('../templates.js');
const route_manager = require('../route_manager.js');
const { dest } = require('../config.js');

function ensure_array(thing) {
	return Array.isArray(thing) ? thing : [thing]; // omg webpack what the HELL are you doing
}

module.exports = function generate_asset_cache(clientInfo, serverInfo) {
	const main_file = `/client/${ensure_array(clientInfo.assetsByChunkName.main)[0]}`;

	const chunk_files = clientInfo.assets.map(chunk => `/client/${chunk.name}`);

	const service_worker = generate_service_worker(chunk_files);
	const index = generate_index(main_file);

	fs.writeFileSync(path.join(dest, 'service-worker.js'), service_worker);
	fs.writeFileSync(path.join(dest, 'index.html'), index);

	return {
		client: {
			main_file,
			chunk_files,

			main: read(`${dest}${main_file}`),
			chunks: chunk_files.reduce((lookup, file) => {
				lookup[file] = read(`${dest}${file}`);
				return lookup;
			}, {}),

			routes: route_manager.routes.reduce((lookup, route) => {
				lookup[route.id] = `/client/${ensure_array(clientInfo.assetsByChunkName[route.id])[0]}`;
				return lookup;
			}, {}),

			index,
			service_worker
		},

		server: {
			entry: path.resolve(dest, 'server', serverInfo.assetsByChunkName.server_routes)
		}
	};
};

function generate_service_worker(chunk_files) {
	const assets = glob.sync('**', { cwd: 'assets', nodir: true });

	const route_code = `[${
		route_manager.routes
			.filter(route => route.type === 'page')
			.map(route => `{ pattern: ${route.pattern} }`)
			.join(', ')
	}]`;

	return read('templates/service-worker.js')
		.replace('__timestamp__', Date.now())
		.replace('__assets__', JSON.stringify(assets))
		.replace('__shell__', JSON.stringify(chunk_files.concat('/index.html')))
		.replace('__routes__', route_code);
}

function generate_index(main_file) {
	return templates.render(200, {
		styles: '',
		head: '',
		html: '<noscript>Please enable JavaScript!</noscript>',
		main: main_file
	});
}

function read(file) {
	return fs.readFileSync(file, 'utf-8');
}
