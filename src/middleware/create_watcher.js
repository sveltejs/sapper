import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { create_assets, create_routes, create_app } from 'sapper/core.js';
import { dest } from '../config.js';

function deferred() {
	const d = {};

	d.promise = new Promise((fulfil, reject) => {
		d.fulfil = fulfil;
		d.reject = reject;
	});

	return d;
}

export default function create_watcher({ compilers, dev, entry, src, onroutes }) {
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

		return create_assets({
			src, dest, dev,
			client_info: client_stats.toJson(),
			server_info: server_stats.toJson()
		});
	});

	function watch_compiler(type) {
		const compiler = compilers[type];

		compiler.plugin('invalid', filename => {
			console.log(chalk.cyan(`${type} bundle invalidated, file changed: ${chalk.bold(filename)}`));
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

	const chokidar = require('chokidar');

	function watch_files(pattern, callback) {
		const watcher = chokidar.watch(pattern, {
			persistent: false
		});

		watcher.on('add', callback);
		watcher.on('change', callback);
		watcher.on('unlink', callback);

		// watch('templates/**.html', () => {
		// 	create_templates();
		// 	// TODO reload current page?
		// });
	}

	watch_files('routes/**/*.+(html|js|mjs)', () => {
		const routes = create_routes({ src });
		onroutes(routes);

		create_app({ dev, entry, src }); // TODO this calls `create_routes` again, we should pass `routes` to `create_app` instead
	});

	watch_files('templates/main.js', () => {
		create_app({ dev, entry, src });
	});

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
}