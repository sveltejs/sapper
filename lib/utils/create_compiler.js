const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const { dev } = require('../config.js');
const templates = require('../templates.js');

module.exports = function create_compiler(client, server, dest, routes, dev) {
	const compiler = {};

	function client_updated(stats) {
		console.log(stats.toString({ colors: true }));

		const info = stats.toJson();

		compiler.client_main = `/client/${info.assetsByChunkName.main}`;
		compiler.assets = info.assets.map(asset => `/client/${asset.name}`);

		const _fs = client.outputFileSystem && client.outputFileSystem.readFileSync ? client.outputFileSystem : fs;
		compiler.asset_cache = {};
		compiler.assets.forEach(file => {
			compiler.asset_cache[file] = _fs.readFileSync(path.join(dest, file), 'utf-8');
		});
	}

	function server_updated(stats) {
		console.log(stats.toString({ colors: true }));

		const info = stats.toJson();
		compiler.server_routes = path.resolve(dest, 'server', info.assetsByChunkName.server_routes);
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

		client.plugin('invalid', filename => {
			console.log(chalk.red(`client bundle invalidated, file changed: ${chalk.bold(filename)}`));
			client_is_ready = false;
			compiler.ready = invalidate();
		});

		client.plugin('done', stats => {
			if (stats.hasErrors()) {
				reject(stats.toJson().errors[0]);
			} else {
				client_updated(stats);
			}

			client_is_ready = true;
			if (server_is_ready) fulfil();
		});

		client.plugin('failed', reject);

		server.plugin('invalid', filename => {
			console.log(chalk.red(`server bundle invalidated, file changed: ${chalk.bold(filename)}`));
			server_is_ready = false;
			compiler.ready = invalidate();
		});

		server.plugin('done', stats => {
			if (stats.hasErrors()) {
				reject(stats.toJson().errors[0]);
			} else {
				server_updated(stats);
			}

			server_is_ready = true;
			if (client_is_ready) fulfil();
		});

		server.plugin('failed', reject);

		client.watch({}, (err, stats) => {
			if (stats.hasErrors()) {
				reject(stats.toJson().errors[0]);
			} else {
				client_updated(stats);
				client_is_ready = true;
				if (server_is_ready) fulfil();
			}
		});

		server.watch({}, (err, stats) => {
			if (stats.hasErrors()) {
				reject(stats.toJson().errors[0]);
			} else {
				server_updated(stats);
				server_is_ready = true;
				if (client_is_ready) fulfil();
			}
		});
	} else {
		compiler.ready = Promise.all([
			new Promise((fulfil, reject) => {
				client.run((err, stats) => {
					if (stats.hasErrors()) {
						reject(stats.toJson().errors[0]);
					} else {
						client_updated(stats);
					}
					fulfil();
				});
			}),

			new Promise((fulfil, reject) => {
				server.run((err, stats) => {
					if (stats.hasErrors()) {
						reject(stats.toJson().errors[0]);
					} else {
						server_updated(stats);
					}
					fulfil();
				});
			})
		]).then(both_updated);
	}

	return compiler;
};