const fs = require('fs');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const { dev } = require('../config.js');
const templates = require('../templates.js');

module.exports = function create_webpack_compiler(dest, routes, dev) {
	const compiler = {};

	function go() {
		const client = webpack(
			require(path.resolve('webpack.client.config.js'))
		);

		const server = webpack(
			require(path.resolve('webpack.server.config.js'))
		);

		function client_updated(err, stats, reject) {
			console.log(stats.toString({ colors: true }));

			const info = stats.toJson();

			if (err || stats.hasErrors()) {
				reject(err || info.errors[0]);
			}

			compiler.client_main = `/client/${info.assetsByChunkName.main}`;
			compiler.assets = info.assets.map(asset => `/client/${asset.name}`);

			compiler.asset_cache = {};
			compiler.assets.forEach(file => {
				compiler.asset_cache[file] = fs.readFileSync(path.join(dest, file), 'utf-8');
			});
		}

		function server_updated(err, stats, reject) {
			console.log(stats.toString({ colors: true }));

			const info = stats.toJson();

			if (err || stats.hasErrors()) {
				reject(err || info.errors[0]);
			}

			compiler.chunks = info.assetsByChunkName;
		}

		function both_updated() {
			const assets = glob.sync('**', { cwd: 'assets', nodir: true });

			const route_code = `[${
				routes
					.filter(route => route.type === 'page')
					.map(route => `{ pattern: ${route.pattern} }`)
					.join(', ')
			}]`;

			compiler.service_worker = fs.readFileSync('templates/service-worker.js', 'utf-8')
				.replace('__timestamp__', Date.now())
				.replace('__assets__', JSON.stringify(assets))
				.replace('__shell__', JSON.stringify(compiler.assets.concat('/index.html')))
				.replace('__routes__', route_code);

			compiler.shell = templates.render(200, {
				styles: '',
				head: '',
				html: '<noscript>Please enable JavaScript!</noscript>',
				main: compiler.client_main
			});

			// useful for debugging, but the files are served from memory
			fs.writeFileSync(path.resolve(dest, 'service-worker.js'), compiler.service_worker);
			fs.writeFileSync(path.resolve(dest, 'index.html'), compiler.shell);
		}

		if (dev) {
			let client_is_ready = false;
			let server_is_ready = false;

			let fulfil;
			let reject;

			const invalidate = () => new Promise((f, r) => {
				fulfil = f;
				reject = r;
			});

			compiler.ready = invalidate();

			client.plugin('invalid', () => {
				client_is_ready = false;
				compiler.ready = invalidate();
			});

			server.plugin('invalid', () => {
				server_is_ready = false;
				compiler.ready = invalidate();
			});

			client.watch({}, (err, stats) => {
				client_updated(err, stats, reject);
				client_is_ready = true;
				if (server_is_ready) fulfil();
			});

			server.watch({}, (err, stats) => {
				server_updated(err, stats, reject);
				server_is_ready = true;
				if (client_is_ready) fulfil();
			});
		} else {
			compiler.ready = Promise.all([
				new Promise((fulfil, reject) => {
					client.run((err, stats) => {
						client_updated(err, stats, reject);
						fulfil();
					});
				}),

				new Promise((fulfil, reject) => {
					server.run((err, stats) => {
						server_updated(err, stats, reject);
						fulfil();
					});
				})
			]).then(both_updated);
		}
	}

	// TODO rerun go when routes are added/renamed
	// (or webpack config/templates change?)
	go();

	return compiler;
};