import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as child_process from 'child_process';
import * as ports from 'port-authority';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { locations } from '../config';
import { EventEmitter } from 'events';
import { create_routes, create_main_manifests, create_compilers, create_serviceworker_manifest } from '../core';
import { Compiler, Compilers, CompileResult, CompileError } from '../core/create_compilers';
import Deferred from './utils/Deferred';
import * as events from './interfaces';

export function dev(opts) {
	return new Watcher(opts);
}

class Watcher extends EventEmitter {
	dirs: {
		app: string;
		dest: string;
		routes: string;
		webpack: string;
	}
	port: number;
	closed: boolean;

	dev_server: DevServer;
	proc: child_process.ChildProcess;
	filewatchers: Array<{ close: () => void }>;
	deferreds: {
		client: Deferred;
		server: Deferred;
	};

	crashed: boolean;
	restarting: boolean;
	current_build: {
		changed: Set<string>;
		rebuilding: Set<string>;
		unique_warnings: Set<string>;
		unique_errors: Set<string>;
	}

	constructor({
		app = locations.app(),
		dest = locations.dest(),
		routes = locations.routes(),
		webpack = 'webpack',
		rollup = 'rollup',
		port = +process.env.PORT
	}: {
		app: string,
		dest: string,
		routes: string,
		webpack: string,
		rollup: string,
		port: number
	}) {
		super();

		this.dirs = { app, dest, routes, webpack, rollup };
		this.port = port;
		this.closed = false;

		this.filewatchers = [];

		this.current_build = {
			changed: new Set(),
			rebuilding: new Set(),
			unique_errors: new Set(),
			unique_warnings: new Set()
		};

		// remove this in a future version
		const template = fs.readFileSync(path.join(app, 'template.html'), 'utf-8');
		if (template.indexOf('%sapper.base%') === -1) {
			const error = new Error(`As of Sapper v0.10, your template.html file must include %sapper.base% in the <head>`);
			error.code = `missing-sapper-base`;
			throw error;
		}

		process.env.NODE_ENV = 'development';

		process.on('exit', () => {
			this.close();
		});

		this.init();
	}

	async init() {
		if (this.port) {
			if (!await ports.check(this.port)) {
				this.emit('fatal', <events.FatalEvent>{
					message: `Port ${this.port} is unavailable`
				});
				return;
			}
		} else {
			this.port = await ports.find(3000);
		}

		const { dest } = this.dirs;
		rimraf.sync(dest);
		mkdirp.sync(dest);

		const dev_port = await ports.find(10000);

		try {
			const routes = create_routes();
			create_main_manifests({ routes, dev_port });
		} catch (err) {
			this.emit('fatal', <events.FatalEvent>{
				message: err.message
			});
			return;
		}

		this.dev_server = new DevServer(dev_port);

		this.filewatchers.push(
			watch_dir(
				locations.routes(),
				({ path: file, stats }) => {
					if (stats.isDirectory()) {
						return path.basename(file)[0] !== '_';
					}
					return true;
				},
				() => {
					const routes = create_routes();
					create_main_manifests({ routes, dev_port });

					try {
						const routes = create_routes();
						create_main_manifests({ routes, dev_port });
					} catch (err) {
						this.emit('error', <events.ErrorEvent>{
							message: err.message
						});
					}
				}
			),

			fs.watch(`${locations.app()}/template.html`, () => {
				this.dev_server.send({
					action: 'reload'
				});
			})
		);

		this.deferreds = {
			server: new Deferred(),
			client: new Deferred()
		};

		// TODO watch the configs themselves?
		const compilers: Compilers = create_compilers({
			webpack: this.dirs.webpack,
			rollup: this.dirs.rollup
		});

		let log = '';

		const emitFatal = () => {
			this.emit('fatal', <events.FatalEvent>{
				message: `Server crashed`,
				log
			});

			this.crashed = true;
			this.proc = null;
		};

		this.watch(compilers.server, {
			name: 'server',

			invalid: filename => {
				this.restart(filename, 'server');
				this.deferreds.server = new Deferred();
			},

			handle_result: (result: CompileResult) => {
				this.deferreds.client.promise.then(() => {
					const restart = () => {
						log = '';
						this.crashed = false;

						ports.wait(this.port)
							.then((() => {
								this.emit('ready', <events.ReadyEvent>{
									port: this.port,
									process: this.proc
								});

								this.deferreds.server.fulfil();

								this.dev_server.send({
									status: 'completed'
								});
							}))
							.catch(err => {
								if (this.crashed) return;

								this.emit('fatal', <events.FatalEvent>{
									message: `Server is not listening on port ${this.port}`,
									log
								});
							});
					};

					if (this.proc) {
						this.proc.removeListener('exit', emitFatal);
						this.proc.kill();
						this.proc.on('exit', restart);
					} else {
						restart();
					}

					this.proc = child_process.fork(`${dest}/server.js`, [], {
						cwd: process.cwd(),
						env: Object.assign({
							PORT: this.port
						}, process.env),
						stdio: ['ipc']
					});

					this.proc.stdout.on('data', chunk => {
						log += chunk;
						this.emit('stdout', chunk);
					});

					this.proc.stderr.on('data', chunk => {
						log += chunk;
						this.emit('stderr', chunk);
					});

					this.proc.on('message', message => {
						if (message.__sapper__ && message.event === 'basepath') {
							this.emit('basepath', {
								basepath: message.basepath
							});
						}
					});

					this.proc.on('exit', emitFatal);
				});
			}
		});

		let first = true;

		this.watch(compilers.client, {
			name: 'client',

			invalid: filename => {
				this.restart(filename, 'client');
				this.deferreds.client = new Deferred();

				// TODO we should delete old assets. due to a webpack bug
				// i don't even begin to comprehend, this is apparently
				// quite difficult
			},

			handle_result: (result: CompileResult) => {
				fs.writeFileSync(path.join(dest, 'client_assets.json'), JSON.stringify(result.assetsByChunkName, null, '  '));
				this.deferreds.client.fulfil();

				const client_files = result.assets.map((file: string) => `client/${file}`);

				create_serviceworker_manifest({
					routes: create_routes(),
					client_files
				});

				// we need to wait a beat before watching the service
				// worker, because of some webpack nonsense
				setTimeout(watch_serviceworker, 100);
			}
		});

		let watch_serviceworker = compilers.serviceworker
			? () => {
				watch_serviceworker = noop;

				this.watch(compilers.serviceworker, {
					name: 'service worker'
				});
			}
			: noop;
	}

	close() {
		if (this.closed) return;
		this.closed = true;

		if (this.dev_server) this.dev_server.close();

		if (this.proc) this.proc.kill();
		this.filewatchers.forEach(watcher => {
			watcher.close();
		});
	}

	restart(filename: string, type: string) {
		if (this.restarting) {
			this.current_build.changed.add(filename);
			this.current_build.rebuilding.add(type);
		} else {
			this.restarting = true;

			this.current_build = {
				changed: new Set([filename]),
				rebuilding: new Set([type]),
				unique_warnings: new Set(),
				unique_errors: new Set()
			};

			process.nextTick(() => {
				this.emit('invalid', <events.InvalidEvent>{
					changed: Array.from(this.current_build.changed),
					invalid: {
						server: this.current_build.rebuilding.has('server'),
						client: this.current_build.rebuilding.has('client'),
						serviceworker: this.current_build.rebuilding.has('serviceworker'),
					}
				});

				this.restarting = false;
			});
		}
	}

	watch(compiler: Compiler, { name, invalid = noop, handle_result = noop }: {
		name: string,
		invalid?: (filename: string) => void;
		handle_result?: (result: CompileResult) => void;
	}) {
		compiler.oninvalid(invalid);

		compiler.watch((err?: Error, result?: CompileResult) => {
			if (err) {
				this.emit('error', <events.ErrorEvent>{
					type: name,
					message: err.message
				});
			} else {
				this.emit('build', {
					type: name,

					duration: result.duration,
					errors: result.errors,
					warnings: result.warnings
				});

				handle_result(result);
			}
		});
	}
}

const INTERVAL = 10000;

class DevServer {
	clients: Set<http.ServerResponse>;
	interval: NodeJS.Timer;
	_: http.Server;

	constructor(port: number, interval = 10000) {
		this.clients = new Set();

		this._ = http.createServer((req, res) => {
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

			this.clients.add(res);
			req.on('close', () => {
				this.clients.delete(res);
			});
		});

		this._.listen(port);

		this.interval = setInterval(() => {
			this.send(null);
		}, INTERVAL);
	}

	close() {
		this._.close();
		clearInterval(this.interval);
	}

	send(data: any) {
		this.clients.forEach(client => {
			client.write(`data: ${JSON.stringify(data)}\n\n`);
		});
	}
}

function noop() {}

function watch_dir(
	dir: string,
	filter: ({ path, stats }: { path: string, stats: fs.CompileResult }) => boolean,
	callback: () => void
) {
	let watch;
	let closed = false;

	import('cheap-watch').then(CheapWatch => {
		if (closed) return;

		watch = new CheapWatch({ dir, filter, debounce: 50 });

		watch.on('+', ({ isNew }) => {
			if (isNew) callback();
		});

		watch.on('-', callback);

		watch.init();
	});

	return {
		close: () => {
			if (watch) watch.close();
			closed = true;
		}
	};
}