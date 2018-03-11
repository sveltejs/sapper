import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as clorox from 'clorox';
import * as child_process from 'child_process';
import * as http from 'http';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import format_messages from 'webpack-format-messages';
import prettyMs from 'pretty-ms';
import * as ports from 'port-authority';
import { dest } from '../config';
import { create_compilers, create_app, create_routes, create_serviceworker } from 'sapper/core.js';

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
		if (req.url !== '/__sapper__') return;

		req.socket.setKeepAlive(true);
		res.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Cache-Control',
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

export default async function dev(port: number) {
	process.env.NODE_ENV = 'development';

	const dir = dest();
	rimraf.sync(dir);
	mkdirp.sync(dir);

	const dev_port = await ports.find(10000);

	const routes = create_routes();
	create_app({ routes, dev_port });

	const hot_update_server = create_hot_update_server(dev_port);

	watch_files('routes/**/*', ['add', 'unlink'], () => {
		const routes = create_routes();
		create_app({ routes, dev_port });
	});

	watch_files('app/template.html', ['change'], () => {
		hot_update_server.send({
			action: 'reload'
		});
	});

	let proc: child_process.ChildProcess;

	process.on('exit', () => {
		// sometimes webpack crashes, so we need to kill our children
		if (proc) proc.kill();
	});

	const deferreds = {
		server: deferred(),
		client: deferred()
	};

	let restarting = false;
	let build = {
		unique_warnings: new Set(),
		unique_errors: new Set()
	};

	function restart_build(filename: string) {
		if (restarting) return;

		restarting = true;
		build = {
			unique_warnings: new Set(),
			unique_errors: new Set()
		};

		process.nextTick(() => {
			restarting = false;
		});

		console.log(`\n${clorox.bold.cyan(path.relative(process.cwd(), filename))} changed. rebuilding...`);
	}

	// TODO watch the configs themselves?
	const compilers = create_compilers();

	function watch(compiler: any, { name, invalid = noop, error = noop, result }: {
		name: string,
		invalid?: (filename: string) => void;
		error?: (error: Error) => void;
		result: (stats: any) => void;
	}) {
		compiler.hooks.invalid.tap('sapper', (filename: string) => {
			invalid(filename);
		});

		compiler.watch({}, (err: Error, stats: any) => {
			if (err) {
				console.error(clorox.red(`✗ ${name}`));
				console.error(clorox.red(err.message));
				error(err);
			} else {
				const messages = format_messages(stats);
				const info = stats.toJson();

				if (messages.errors.length > 0) {
					console.log(clorox.bold.red(`✗ ${name}`));

					const filtered = messages.errors.filter((message: string) => {
						return !build.unique_errors.has(message);
					});

					filtered.forEach((message: string) => {
						build.unique_errors.add(message);
						console.log(message);
					});

					const hidden = messages.errors.length - filtered.length;
					if (hidden > 0) {
						console.log(`${hidden} duplicate ${hidden === 1 ? 'error' : 'errors'} hidden\n`);
					}
				} else {
					if (messages.warnings.length > 0) {
						console.log(clorox.bold.yellow(`• ${name}`));

						const filtered = messages.warnings.filter((message: string) => {
							return !build.unique_warnings.has(message);
						});

						filtered.forEach((message: string) => {
							build.unique_warnings.add(message);
							console.log(`${message}\n`);
						});

						const hidden = messages.warnings.length - filtered.length;
						if (hidden > 0) {
							console.log(`${hidden} duplicate ${hidden === 1 ? 'warning' : 'warnings'} hidden\n`);
						}
					} else {
						console.log(`${clorox.bold.green(`✔ ${name}`)} ${clorox.grey(`(${prettyMs(info.time)})`)}`);
					}

					result(info);
				}
			}
		});
	}

	watch(compilers.server, {
		name: 'server',

		invalid: filename => {
			restart_build(filename);
			// TODO print message
			deferreds.server = deferred();
		},

		result: info => {
			// TODO log compile errors/warnings

			fs.writeFileSync(path.join(dir, 'server_info.json'), JSON.stringify(info, null, '  '));

			deferreds.client.promise.then(() => {
				function restart() {
					ports.wait(port).then(deferreds.server.fulfil);
				}

				if (proc) {
					proc.kill();
					proc.on('exit', restart);
				} else {
					restart();
				}

				proc = child_process.fork(`${dir}/server.js`, [], {
					cwd: process.cwd(),
					env: Object.assign({
						PORT: port
					}, process.env)
				});
			});
		}
	});

	watch(compilers.client, {
		name: 'client',

		invalid: filename => {
			restart_build(filename);
			deferreds.client = deferred();

			// TODO we should delete old assets. due to a webpack bug
			// i don't even begin to comprehend, this is apparently
			// quite difficult
		},

		result: info => {
			fs.writeFileSync(path.join(dir, 'client_info.json'), JSON.stringify(info, null, '  '));
			deferreds.client.fulfil();

			const client_files = info.assets.map((chunk: { name: string }) => `/client/${chunk.name}`);

			deferreds.server.promise.then(() => {
				hot_update_server.send({
					status: 'completed'
				});
			});

			create_serviceworker({
				routes: create_routes(),
				client_files
			});

			watch_serviceworker();
		}
	});

	let watch_serviceworker = compilers.serviceworker
		? function() {
			watch_serviceworker = noop;

			watch(compilers.serviceworker, {
				name: 'service worker',

				result: info => {
					fs.writeFileSync(path.join(dir, 'serviceworker_info.json'), JSON.stringify(info, null, '  '));
				}
			});
		}
		: noop;
}

function noop() {}

function watch_files(pattern: string, events: string[], callback: () => void) {
	const chokidar = require('chokidar');

	const watcher = chokidar.watch(pattern, {
		persistent: true,
		ignoreInitial: true
	});

	events.forEach(event => {
		watcher.on(event, callback);
	});
}
