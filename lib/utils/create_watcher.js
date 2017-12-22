const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const compilers = require('./compilers.js');
const generate_asset_cache = require('./generate_asset_cache.js');
const { dest } = require('../config.js');

function deferred() {
	const d = {};

	d.promise = new Promise((fulfil, reject) => {
		d.fulfil = fulfil;
		d.reject = reject;
	});

	return d;
}

module.exports = function create_watcher() {
	const deferreds = {
		client: deferred(),
		server: deferred()
	};

	const invalidate = () => Promise.all([
		deferreds.client.promise,
		deferreds.server.promise
	]).then(([client_stats, server_stats]) => {
		const client_info = client_stats.toJson();
		fs.writeFileSync(path.join(dest, 'stats.client.json'), JSON.stringify(client_info, null, '  '));

		const server_info = server_stats.toJson();
		fs.writeFileSync(path.join(dest, 'stats.server.json'), JSON.stringify(server_info, null, '  '));

		return generate_asset_cache(
			client_stats.toJson(),
			server_stats.toJson()
		);
	});

	function watch_compiler(type) {
		const compiler = compilers[type];

		compiler.plugin('invalid', filename => {
			console.log(chalk.red(`${type} bundle invalidated, file changed: ${chalk.bold(filename)}`));
			deferreds[type] = deferred();
			watcher.ready = invalidate();
		});

		compiler.plugin('failed', err => {
			deferreds[type].reject(err);
		});

		return compiler.watch({}, (err, stats) => {
			if (stats.hasErrors()) {
				deferreds[type].reject(stats.toJson().errors[0]);
			} else {
				deferreds[type].fulfil(stats);
			}
		});
	}

	const watcher = {
		ready: invalidate(),
		client: watch_compiler('client'),
		server: watch_compiler('server'),

		close: () => {
			watcher.client.close();
			watcher.server.close();
		}
	};

	return watcher;
};