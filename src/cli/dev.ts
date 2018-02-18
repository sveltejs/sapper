import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as chalk from 'chalk';
import * as child_process from 'child_process';
import * as http from 'http';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { wait_for_port } from './utils';
import { create_compilers, create_app, create_routes, create_serviceworker, create_template } from 'sapper/core.js';

type Deferred = {
	promise?: Promise<any>;
	fulfil?: (value?: any) => void;
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

function create_hot_update_server(port: number, interval = 10000) {
	const clients = new Set();

	const server = http.createServer((req, res) => {
		if (req.url !== '/hmr') return;

		req.socket.setKeepAlive(true);
		res.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'text/event-stream;charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive',
			// While behind nginx, event stream should not be buffered:
			// http://nginx.org/docs/http/ngx_http_proxy_module.html#proxy_buffering
			'X-Accel-Buffering': 'no'
		});

		res.write('\n');

		clients.add(res);
		req.on('close', () => {
			clients.delete(res);
		});
	});

	server.listen(port);

	function send(data: any) {
		clients.forEach(client => {
			client.write(`data: ${JSON.stringify(data)}\n\n`);
		});
	}

	setInterval(() => {
		send(null)
	}, interval);

	return { send };
}

export default async function dev(src: string, dir: string) {
	rimraf.sync(dir);
	mkdirp.sync(dir);

	const chokidar = require('chokidar');

	// initial build
	const dev_port = await require('get-port')(10000);

	const routes = create_routes({ src });
	create_app({ routes, src, dev: true, dev_port });

	const hot_update_server = create_hot_update_server(dev_port);

	// TODO watch the configs themselves?
	const compilers = create_compilers();

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
		create_app({ routes, src, dev: true, dev_port });
	});

	watch_files('app/template.html', () => {
		const template = create_template();
		// TODO reload current page?
	});

	let proc: child_process.ChildProcess;

	const deferreds = {
		server: deferred(),
		client: deferred()
	};

	const times = {
		client_start: Date.now(),
		server_start: Date.now(),
		serviceworker_start: Date.now()
	};

	compilers.server.plugin('invalid', () => {
		times.server_start = Date.now();
		// TODO print message
		deferreds.server = deferred();
	});

	compilers.server.watch({}, (err: Error, stats: any) => {
		if (err) {
			console.error(chalk.red(err.message));
		} else if (stats.hasErrors()) {
			// print errors. TODO notify client
			stats.toJson().errors.forEach((error: Error) => {
				console.error(error); // TODO make this look nice
			});
		} else {
			console.log(`built server in ${Date.now() - times.server_start}ms`); // TODO prettify

			const server_info = stats.toJson();
			fs.writeFileSync(path.join(dir, 'server_info.json'), JSON.stringify(server_info, null, '  '));

			deferreds.client.promise.then(() => {
				if (proc) proc.kill();

				proc = child_process.fork(`${dir}/server.js`, [], {
					cwd: process.cwd(),
					env: Object.assign({}, process.env)
				});

				wait_for_port(3000, deferreds.server.fulfil); // TODO control port
			});
		}
	});

	compilers.client.plugin('invalid', (filename: string) => {
		times.client_start = Date.now();

		deferreds.client = deferred();

		// TODO print message
		fs.readdirSync(path.join(dir, 'client')).forEach(file => {
			fs.unlinkSync(path.join(dir, 'client', file));
		});
	});

	compilers.client.watch({}, (err: Error, stats: any) => {
		if (err) {
			console.error(chalk.red(err.message));
		} else if (stats.hasErrors()) {
			// print errors. TODO notify client
			stats.toJson().errors.forEach((error: Error) => {
				console.error(error); // TODO make this look nice
			});
		} else {
			console.log(`built client in ${Date.now() - times.client_start}ms`); // TODO prettify

			const client_info = stats.toJson();
			fs.writeFileSync(path.join(dir, 'client_info.json'), JSON.stringify(client_info, null, '  '));
			deferreds.client.fulfil();

			const client_files = client_info.assets.map((chunk: { name: string }) => `/client/${chunk.name}`);

			deferreds.server.promise.then(() => {
				hot_update_server.send({
					status: 'completed'
				});
			});

			return create_serviceworker({
				routes: create_routes({ src }),
				client_files,
				src
			});
		}
	});

	if (compilers.serviceworker) {
		compilers.serviceworker.plugin('invalid', (filename: string) => {
			times.serviceworker_start = Date.now();
		});

		compilers.client.watch({}, (err: Error, stats: any) => {
			if (err) {
				// TODO notify client
			} else if (stats.hasErrors()) {
				// print errors. TODO notify client
				stats.toJson().errors.forEach((error: Error) => {
					console.error(error); // TODO make this look nice
				});
			} else {
				console.log(`built service worker in ${Date.now() - times.serviceworker_start}ms`); // TODO prettify

				const serviceworker_info = stats.toJson();
				fs.writeFileSync(path.join(dir, 'serviceworker_info.json'), JSON.stringify(serviceworker_info, null, '  '));
				// TODO trigger reload?
			}
		});
	}
}