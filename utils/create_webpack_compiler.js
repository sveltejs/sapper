const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

module.exports = function create_webpack_compiler(out, routes, dev) {
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
		compiler.client_main = new Promise((fulfil, reject) => {
			client.run((err, stats) => {
				console.log(stats.toString({ colors: true }));

				if (err || stats.hasErrors()) {
					reject(err || stats.toJson().errors[0]);
				}

				const filename = stats.toJson().assetsByChunkName.main;
				fulfil(`/client/${filename}`);
			});
		});

		const chunks = new Promise((fulfil, reject) => {
			server.run((err, stats) => {
				console.log(stats.toString({ colors: true }));

				if (err || stats.hasErrors()) {
					reject(err || stats.toJson().errors[0]);
				}

				fulfil(stats.toJson().assetsByChunkName);
			});
		});

		compiler.get_chunk = async id => {
			const assetsByChunkName = await chunks;
			return path.resolve(out, 'server', assetsByChunkName[id]);
		};
	}

	return compiler;
};