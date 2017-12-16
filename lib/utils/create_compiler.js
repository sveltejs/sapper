const fs = require('fs');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const templates = require('../templates.js');

module.exports = function create_webpack_compiler(dest, routes, dev) {
	const compiler = {};

	const client = webpack(
		require(path.resolve('webpack.client.config.js'))
	);

	const server = webpack(
		require(path.resolve('webpack.server.config.js'))
	);

	if (false) { // TODO watch in dev
		// TODO how can we invalidate compiler.client_main when watcher restarts?
		compiler.client_main = new Promise((fulfil, reject) => {
			client.watch({}, (err, stats) => {
				if (err || stats.hasErrors()) {
					// TODO handle errors
				}

				const filename = stats.toJson().assetsByChunkName.main;
				fulfil(`/client/${filename}`);
			});
		});

		// TODO server
	} else {
		compiler.ready = Promise.all([
			new Promise((fulfil, reject) => {
				client.run((err, stats) => {
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

					fulfil();
				});
			}),

			new Promise((fulfil, reject) => {
				server.run((err, stats) => {
					console.log(stats.toString({ colors: true }));

					const info = stats.toJson();

					if (err || stats.hasErrors()) {
						reject(err || info.errors[0]);
					}

					compiler.chunks = info.assetsByChunkName;
					fulfil();
				});
			})
		]).then(() => {
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
		});

		compiler.get_chunk = async id => {
			return path.resolve(dest, 'server', compiler.chunks[id]);
		};
	}

	return compiler;
};