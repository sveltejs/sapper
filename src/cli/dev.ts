import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';
import * as child_process from 'child_process';
import { create_compilers, create_app, create_routes, create_serviceworker, create_template } from 'sapper/core.js';

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

export default function create_watcher(src: string, dir: string) {
	// initial build
	const routes = create_routes({ src });
	create_app({ routes, src, dev: true });

	const compilers = create_compilers();

	const deferreds = {
		client: deferred(),
		server: deferred()
	};

	const invalidate = () => Promise.all([
		deferreds.client.promise,
		deferreds.server.promise
	]).then(([client_stats, server_stats]) => {
		const client_info = client_stats.toJson();
		fs.writeFileSync(path.join(dir, 'stats.client.json'), JSON.stringify(client_info, null, '  '));

		const server_info = server_stats.toJson();
		fs.writeFileSync(path.join(dir, 'stats.server.json'), JSON.stringify(server_info, null, '  '));

		const client_files = client_info.assets.map((chunk: { name: string }) => `/client/${chunk.name}`);

		return create_serviceworker({
			routes: create_routes({ src }),
			client_files,
			src
		});
	});

	function watch_compiler(type: 'client' | 'server', callback: (err: Error) => void) {
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
		create_app({ routes, src, dev: true });
	});

	watch_files('app/template.html', () => {
		const template = create_template();
		// TODO reload current page?
	});

	watch_compiler('client', () => {

	});

	watch_compiler('server', () => {

	});
}