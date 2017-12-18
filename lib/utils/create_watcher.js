const path = require('path');
const chalk = require('chalk');
const compilers = require('./compilers.js');
const generate_asset_cache = require('./generate_asset_cache.js');

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
		return generate_asset_cache(
			client_stats.toJson(),
			server_stats.toJson()
		);
	});

	watcher = {
		ready: invalidate()
	};

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

		compiler.watch({}, (err, stats) => {
			if (stats.hasErrors()) {
				deferreds[type].reject(stats.toJson().errors[0]);
			} else {
				deferreds[type].fulfil(stats);
			}
		});
	}

	watch_compiler('client');
	watch_compiler('server');

	return watcher;
};