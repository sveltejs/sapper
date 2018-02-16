import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { create_app, create_serviceworker, create_routes, create_template } from 'sapper/core.js';
import { dest } from '../config.js';

type Deferred = {
	promise?: Promise<any>;
	fulfil?: (value: any) => void;
	reject?: (err: Error) => void;
}

function deferred() {
	const d: Deferred = {};

	d.promise = new Promise((fulfil, reject) => {
		d.fulfil = fulfil;
		d.reject = reject;
	});

	return d;
}

export default function create_watcher({ compilers, dev, entry, src, onroutes, ontemplate }) {
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

		const client_files = client_info.assets.map((chunk: { name: string }) => `/client/${chunk.name}`);

		return create_serviceworker({
			routes: create_routes({ src }),
			client_files,
			src
		});
	});

	function watch_compiler(type: 'client' | 'server') {
		const compiler = compilers[type];

		compiler.plugin('invalid', (filename: string) => {
			console.log(chalk.cyan(`${type} bundle invalidated, file changed: ${chalk.bold(filename)}`));
			deferreds[type] = deferred();
			watcher.ready = invalidate();
		});

		compiler.plugin('failed', (err: Error) => {
			deferreds[type].reject(err);
		});

		return compiler.watch({}, (err: Error, stats: any) => {
			if (stats.hasErrors()) {
				deferreds[type].reject(stats.toJson().errors[0]);
			} else {
				deferreds[type].fulfil(stats);
			}
		});
	}

	const chokidar = require('chokidar');

	function watch_files(pattern: string, callback: () => void) {
		const watcher = chokidar.watch(pattern, {
			persistent: false
		});

		watcher.on('add', callback);
		watcher.on('change', callback);
		watcher.on('unlink', callback);
	}

	watch_files('routes/**/*.+(html|js|mjs)', () => {
		const routes = create_routes({ src });
		onroutes(routes);

		create_app({ routes, src, dev });
	});

	watch_files('app/template.html', () => {
		const template = create_template();
		ontemplate(template);

		// TODO reload current page?
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