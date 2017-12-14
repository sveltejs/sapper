const fs = require('fs');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

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
			const assets = glob.sync('**', { cwd: 'assets' });

			const service_worker = fs.readFileSync('templates/service-worker.js', 'utf-8')
				.replace('__timestamp__', Date.now())
				.replace('__assets__', JSON.stringify(assets))
				.replace('__javascript__', JSON.stringify(compiler.assets));

			fs.writeFileSync(path.resolve(dest, 'service-worker.js'), service_worker);
		});

		compiler.get_chunk = async id => {
			return path.resolve(dest, 'server', compiler.chunks[id]);
		};
	}

	return compiler;
};