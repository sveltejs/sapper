#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var path = require('path');
var mkdirp = _interopDefault(require('mkdirp'));
var rimraf = _interopDefault(require('rimraf'));
var relative = _interopDefault(require('require-relative'));
var glob = _interopDefault(require('glob'));
var chalk = _interopDefault(require('chalk'));
var framer = _interopDefault(require('code-frame'));
var locateCharacter = require('locate-character');
var sander = require('sander');
var express = _interopDefault(require('express'));
var cheerio = _interopDefault(require('cheerio'));
var fetch = _interopDefault(require('node-fetch'));
var URL = _interopDefault(require('url-parse'));
var serialize = _interopDefault(require('serialize-javascript'));
var escape_html = _interopDefault(require('escape-html'));

const webpack = relative('webpack', process.cwd());

const client = webpack(
	require(path.resolve('webpack.client.config.js'))
);

const server = webpack(
	require(path.resolve('webpack.server.config.js'))
);

var compilers = Object.freeze({
	client: client,
	server: server
});

function create_matchers(files) {
	const routes = files
		.map(file => {
			if (/(^|\/|\\)_/.test(file)) return;

			const parts = file.replace(/\.(html|js|mjs)$/, '').split('/'); // glob output is always posix-style
			if (parts[parts.length - 1] === 'index') parts.pop();

			const id = (
				parts.join('_').replace(/[[\]]/g, '$').replace(/^\d/, '_$&').replace(/[^a-zA-Z0-9_$]/g, '_')
			 ) || '_';

			const dynamic = parts
				.filter(part => part[0] === '[')
				.map(part => part.slice(1, -1));

			let pattern_string = '';
			let i = parts.length;
			let nested = true;
			while (i--) {
				const part = parts[i];
				const dynamic = part[0] === '[';

				if (dynamic) {
					pattern_string = nested ? `(?:\\/([^/]+)${pattern_string})?` : `\\/([^/]+)${pattern_string}`;
				} else {
					nested = false;
					pattern_string = `\\/${part}${pattern_string}`;
				}
			}

			const pattern = new RegExp(`^${pattern_string}\\/?$`);

			const test = url => pattern.test(url);

			const exec = url => {
				const match = pattern.exec(url);
				if (!match) return;

				const params = {};
				dynamic.forEach((param, i) => {
					params[param] = match[i + 1];
				});

				return params;
			};

			return {
				id,
				type: path.extname(file) === '.html' ? 'page' : 'route',
				file,
				pattern,
				test,
				exec,
				parts,
				dynamic
			};
		})
		.filter(Boolean)
		.sort((a, b) => {
			let same = true;

			for (let i = 0; true; i += 1) {
				const a_part = a.parts[i];
				const b_part = b.parts[i];

				if (!a_part && !b_part) {
					if (same) throw new Error(`The ${a.file} and ${b.file} routes clash`);
					return 0;
				}

				if (!a_part) return -1;
				if (!b_part) return 1;

				const a_is_dynamic = a_part[0] === '[';
				const b_is_dynamic = b_part[0] === '[';

				if (a_is_dynamic === b_is_dynamic) {
					if (!a_is_dynamic && a_part !== b_part) same = false;
					continue;
				}

				return a_is_dynamic ? 1 : -1;
			}
		});

	return routes;
}

const dev = process.env.NODE_ENV !== 'production';

const templates = path.resolve(process.env.SAPPER_TEMPLATES || 'templates');

const src = path.resolve(process.env.SAPPER_ROUTES || 'routes');

const dest = path.resolve(process.env.SAPPER_DEST || '.sapper');

if (dev) {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));
}

const entry = {
	client: path.resolve(templates, '.main.rendered.js'),
	server: path.resolve(dest, 'server-entry.js')
};

const callbacks = [];

function onchange(fn) {
	callbacks.push(fn);
}

let routes;

function update() {
	routes = create_matchers(
		glob.sync('**/*.+(html|js|mjs)', { cwd: src })
	);

	callbacks.forEach(fn => fn());
}

update();

if (dev) {
	const watcher = require('chokidar').watch(`${src}/**/*.+(html|js|mjs)`, {
		ignoreInitial: true,
		persistent: false
	});

	watcher.on('add', update);
	watcher.on('change', update);
	watcher.on('unlink', update);
}


var route_manager = Object.freeze({
	onchange: onchange,
	get routes () { return routes; }
});

function posixify(file) {
	return file.replace(/[/\\]/g, '/');
}

function create_app() {
	const { routes: routes$$1 } = route_manager;

	function create_client_main() {
		const template = fs.readFileSync('templates/main.js', 'utf-8');

		const code = `[${
			routes$$1
				.filter(route => route.type === 'page')
				.map(route => {
					const params = route.dynamic.length === 0 ?
						'{}' :
						`{ ${route.dynamic.map((part, i) => `${part}: match[${i + 1}]`).join(', ') } }`;

					const file = posixify(`${src}/${route.file}`);
					return `{ pattern: ${route.pattern}, params: match => (${params}), load: () => import(/* webpackChunkName: "${route.id}" */ '${file}') }`
				})
				.join(', ')
		}]`;

		let main = template
			.replace(/__app__/g, posixify(path.resolve(__dirname, '../../runtime/app.js')))
			.replace(/__routes__/g, code)
			.replace(/__dev__/g, String(dev));

		if (dev) {
			const hmr_client = posixify(require.resolve(`webpack-hot-middleware/client`));
			main += `\n\nimport('${hmr_client}?path=/__webpack_hmr&timeout=20000'); if (module.hot) module.hot.accept();`;
		}

		fs.writeFileSync(entry.client, main);

		// need to fudge the mtime, because webpack is soft in the head
		const { atime, mtime } = fs.statSync(entry.client);
		fs.utimesSync(entry.client, new Date(atime.getTime() - 999999), new Date(mtime.getTime() - 999999));
	}

	function create_server_routes() {
		const imports = routes$$1
			.map(route => {
				const file = posixify(`${src}/${route.file}`);
				return route.type === 'page' ?
					`import ${route.id} from '${file}';` :
					`import * as ${route.id} from '${file}';`;
			})
			.join('\n');

		const exports = `export { ${routes$$1.map(route => route.id)} };`;

		fs.writeFileSync(entry.server, `${imports}\n\n${exports}`);

		const { atime, mtime } = fs.statSync(entry.server);
		fs.utimesSync(entry.server, new Date(atime.getTime() - 999999), new Date(mtime.getTime() - 999999));
	}

	create_client_main();
	create_server_routes();
}

if (dev) {
	onchange(create_app);

	const watcher = require('chokidar').watch(`templates/main.js`, {
		ignoreInitial: true,
		persistent: false
	});

	watcher.on('add', create_app);
	watcher.on('change', create_app);
	watcher.on('unlink', create_app);
}

let templates$1;

function error(e) {
	if (e.title) console.error(chalk.bold.red(e.title));
	if (e.body) console.error(chalk.red(e.body));
	if (e.url) console.error(chalk.cyan(e.url));
	if (e.frame) console.error(chalk.grey(e.frame));

	process.exit(1);
}

function create_templates() {
	templates$1 = glob.sync('*.html', { cwd: 'templates' })
		.map(file => {
			const template = fs.readFileSync(`templates/${file}`, 'utf-8');
			const status = file.replace('.html', '').toLowerCase();

			if (!/^[0-9x]{3}$/.test(status)) {
				error({
					title: `templates/${file}`,
					body: `Bad template — should be a valid status code like 404.html, or a wildcard like 2xx.html`
				});
			}

			const index = template.indexOf('%sapper.main%');
			if (index !== -1) {
				// TODO remove this in a future version
				const { line, column } = locateCharacter.locate(template, index, { offsetLine: 1 });
				const frame = framer(template, line, column);

				error({
					title: `templates/${file}`,
					body: `<script src='%sapper.main%'> is unsupported — use %sapper.scripts% (without the <script> tag) instead`,
					url: 'https://github.com/sveltejs/sapper/issues/86',
					frame
				});
			}

			const specificity = (
				(status[0] === 'x' ? 0 : 4) +
				(status[1] === 'x' ? 0 : 2) +
				(status[2] === 'x' ? 0 : 1)
			);

			const pattern = new RegExp(`^${status.split('').map(d => d === 'x' ? '\\d' : d).join('')}$`);

			return {
				test: status => pattern.test(status),
				specificity,
				render: data => {
					return template.replace(/%sapper\.(\w+)%/g, (match, key) => {
						return key in data ? data[key] : '';
					});
				},
				stream: (res, data) => {
					let i = 0;

					function stream_inner() {
						if (i >= template.length) {
							return;
						}

						const start = template.indexOf('%sapper', i);

						if (start === -1) {
							res.end(template.slice(i));
							return;
						}

						res.write(template.slice(i, start));

						const end = template.indexOf('%', start + 1);
						if (end === -1) {
							throw new Error(`Bad template`); // TODO validate ahead of time
						}

						const tag = template.slice(start + 1, end);
						const match = /sapper\.(\w+)/.exec(tag);
						if (!match || !(match[1] in data)) throw new Error(`Bad template`); // TODO ditto

						return Promise.resolve(data[match[1]]).then(datamatch => {
							res.write(datamatch);
							i = end + 1;
							return stream_inner();
						});
					}

					return Promise.resolve().then(stream_inner);
				}
			};
		})
		.sort((a, b) => b.specificity - a.specificity);
}

create_templates();

if (dev) {
	const watcher = require('chokidar').watch('templates/**.html', {
		ignoreInitial: true,
		persistent: false
	});

	watcher.on('add', create_templates);
	watcher.on('change', create_templates);
	watcher.on('unlink', create_templates);
}

function render(status, data) {
	const template = templates$1.find(template => template.test(status));
	if (template) return template.render(data);

	return `Missing template for status code ${status}`;
}

function stream(res, status, data) {
	const template = templates$1.find(template => template.test(status));
	if (template) return template.stream(res, data);

	return `Missing template for status code ${status}`;
}

function ensure_array(thing) {
	return Array.isArray(thing) ? thing : [thing]; // omg webpack what the HELL are you doing
}

function generate_asset_cache(clientInfo, serverInfo) {
	const main_file = `/client/${ensure_array(clientInfo.assetsByChunkName.main)[0]}`;

	const chunk_files = clientInfo.assets.map(chunk => `/client/${chunk.name}`);

	const service_worker = generate_service_worker(chunk_files);
	const index = generate_index(main_file);

	if (dev) {
		fs.writeFileSync(path.join(dest, 'service-worker.js'), service_worker);
		fs.writeFileSync(path.join(dest, 'index.html'), index);
	}

	return {
		client: {
			main_file,
			chunk_files,

			main: read(`${dest}${main_file}`),
			chunks: chunk_files.reduce((lookup, file) => {
				lookup[file] = read(`${dest}${file}`);
				return lookup;
			}, {}),

			routes: routes.reduce((lookup, route) => {
				lookup[route.id] = `/client/${ensure_array(clientInfo.assetsByChunkName[route.id])[0]}`;
				return lookup;
			}, {}),

			index,
			service_worker
		},

		server: {
			entry: path.resolve(dest, 'server', serverInfo.assetsByChunkName.main)
		},

		service_worker
	};
}

function generate_service_worker(chunk_files) {
	const assets = glob.sync('**', { cwd: 'assets', nodir: true });

	const route_code = `[${
		routes
			.filter(route => route.type === 'page')
			.map(route => `{ pattern: ${route.pattern} }`)
			.join(', ')
	}]`;

	return read('templates/service-worker.js')
		.replace(/__timestamp__/g, Date.now())
		.replace(/__assets__/g, JSON.stringify(assets))
		.replace(/__shell__/g, JSON.stringify(chunk_files.concat('/index.html')))
		.replace(/__routes__/g, route_code);
}

function generate_index(main_file) {
	return render(200, {
		styles: '',
		head: '',
		html: '<noscript>Please enable JavaScript!</noscript>',
		main: main_file
	});
}

function read(file) {
	return fs.readFileSync(file, 'utf-8');
}

process.env.NODE_ENV = 'production';

var build = () => {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));

	// create main.js and server-routes.js
	create_app();

	return new Promise((fulfil, reject) => {
		function handleErrors(err, stats) {
			if (err) {
				reject(err);
				process.exit(1);
			}

			if (stats.hasErrors()) {
				console.error(stats.toString({ colors: true }));
				reject(new Error(`Encountered errors while building app`));
			}
		}

		client.run((err, clientStats) => {
			handleErrors(err, clientStats);
			const clientInfo = clientStats.toJson();
			fs.writeFileSync(path.join(dest, 'stats.client.json'), JSON.stringify(clientInfo, null, '  '));

			server.run((err, serverStats) => {
				handleErrors(err, serverStats);
				const serverInfo = serverStats.toJson();
				fs.writeFileSync(path.join(dest, 'stats.server.json'), JSON.stringify(serverInfo, null, '  '));

				generate_asset_cache(clientInfo, serverInfo);
				fulfil();
			});
		});
	});
};

function deferred() {
	const d = {};

	d.promise = new Promise((fulfil, reject) => {
		d.fulfil = fulfil;
		d.reject = reject;
	});

	return d;
}

function create_watcher() {
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

function connect_dev() {
	create_app();

	const watcher = create_watcher();

	let asset_cache;

	const middleware = compose_handlers([
		require('webpack-hot-middleware')(client, {
			reload: true,
			path: '/__webpack_hmr',
			heartbeat: 10 * 1000
		}),

		(req, res, next) => {
			watcher.ready.then(cache => {
				asset_cache = cache;
				next();
			});
		},

		set_req_pathname,

		get_asset_handler({
			filter: pathname => pathname === '/index.html',
			type: 'text/html',
			cache: 'max-age=600',
			fn: () => asset_cache.client.index
		}),

		get_asset_handler({
			filter: pathname => pathname === '/service-worker.js',
			type: 'application/javascript',
			cache: 'max-age=600',
			fn: () => asset_cache.client.service_worker
		}),

		get_asset_handler({
			filter: pathname => pathname.startsWith('/client/'),
			type: 'application/javascript',
			cache: 'max-age=31536000',
			fn: pathname => asset_cache.client.chunks[pathname]
		}),

		get_route_handler(() => asset_cache),

		get_not_found_handler(() => asset_cache)
	]);

	middleware.close = () => {
		watcher.close();
		// TODO shut down chokidar
	};

	return middleware;
}

function connect_prod() {
	const asset_cache = generate_asset_cache(
		read_json$1(path.join(dest, 'stats.client.json')),
		read_json$1(path.join(dest, 'stats.server.json'))
	);

	const middleware = compose_handlers([
		set_req_pathname,

		get_asset_handler({
			filter: pathname => pathname === '/index.html',
			type: 'text/html',
			cache: 'max-age=600',
			fn: () => asset_cache.client.index
		}),

		get_asset_handler({
			filter: pathname => pathname === '/service-worker.js',
			type: 'application/javascript',
			cache: 'max-age=600',
			fn: () => asset_cache.client.service_worker
		}),

		get_asset_handler({
			filter: pathname => pathname.startsWith('/client/'),
			type: 'application/javascript',
			cache: 'max-age=31536000',
			fn: pathname => asset_cache.client.chunks[pathname]
		}),

		get_route_handler(() => asset_cache),

		get_not_found_handler(() => asset_cache)
	]);

	// here for API consistency between dev, and prod, but
	// doesn't actually need to do anything
	middleware.close = () => {};

	return middleware;
}

var middleware = dev ? connect_dev : connect_prod;

function set_req_pathname(req, res, next) {
	req.pathname = req.url.replace(/\?.+/, '');
	next();
}

function get_asset_handler(opts) {
	return (req, res, next) => {
		if (!opts.filter(req.pathname)) return next();

		res.setHeader('Content-Type', opts.type);
		res.setHeader('Cache-Control', opts.cache);

		res.end(opts.fn(req.pathname));
	};
}

const resolved = Promise.resolve();

function get_route_handler(fn) {
	function handle_route(route, req, res, next, { client: client$$1, server: server$$1 }) {
		req.params = route.exec(req.pathname);

		const mod = require(server$$1.entry)[route.id];

		if (route.type === 'page') {
			// preload main.js and current route
			// TODO detect other stuff we can preload? images, CSS, fonts?
			res.setHeader('Link', `<${client$$1.main_file}>;rel="preload";as="script", <${client$$1.routes[route.id]}>;rel="preload";as="script"`);

			const data = { params: req.params, query: req.query };

			if (mod.preload) {
				const promise = Promise.resolve(mod.preload(req)).then(preloaded => {
					const serialized = try_serialize(preloaded);
					Object.assign(data, preloaded);

					return { rendered: mod.render(data), serialized };
				});

				return stream(res, 200, {
					scripts: promise.then(({ serialized }) => {
						const main = `<script src='${client$$1.main_file}'></script>`;

						if (serialized) {
							return `<script>__SAPPER__ = { preloaded: ${serialized} };</script>${main}`;
						}

						return main;
					}),
					html: promise.then(({ rendered }) => rendered.html),
					head: promise.then(({ rendered }) => `<noscript id='sapper-head-start'></noscript>${rendered.head}<noscript id='sapper-head-end'></noscript>`),
					styles: promise.then(({ rendered }) => (rendered.css && rendered.css.code ? `<style>${rendered.css.code}</style>` : ''))
				});
			} else {
				const { html, head, css } = mod.render(data);

				const page = render(200, {
					scripts: `<script src='${client$$1.main_file}'></script>`,
					html,
					head: `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`,
					styles: (css && css.code ? `<style>${css.code}</style>` : '')
				});

				res.end(page);
			}
		}

		else {
			const method = req.method.toLowerCase();
			// 'delete' cannot be exported from a module because it is a keyword,
			// so check for 'del' instead
			const method_export = method === 'delete' ? 'del' : method;
			const handler = mod[method_export];
			if (handler) {
				handler(req, res, next);
			} else {
				// no matching handler for method — 404
				next();
			}
		}
	}

	return function find_route(req, res, next) {
		const url = req.pathname;

		// whatever happens, we're going to serve some HTML
		res.setHeader('Content-Type', 'text/html');

		resolved
			.then(() => {
				for (const route of routes) {
					if (route.test(url)) return handle_route(route, req, res, next, fn());
				}

				// no matching route — 404
				next();
			})
			.catch(err => {
				res.statusCode = 500;
				res.end(render(500, {
					title: (err && err.name) || 'Internal server error',
					url,
					error: escape_html(err && (err.details || err.message || err) || 'Unknown error'),
					stack: err && err.stack.split('\n').slice(1).join('\n')
				}));
			});
	};
}

function get_not_found_handler(fn) {
	return function handle_not_found(req, res) {
		const asset_cache = fn();

		res.statusCode = 404;
		res.end(render(404, {
			title: 'Not found',
			status: 404,
			method: req.method,
			scripts: `<script src='${asset_cache.client.main_file}'></script>`,
			url: req.url
		}));
	};
}

function compose_handlers(handlers) {
	return (req, res, next) => {
		let i = 0;
		function go() {
			const handler = handlers[i];

			if (handler) {
				handler(req, res, () => {
					i += 1;
					go();
				});
			} else {
				next();
			}
		}

		go();
	};
}

function read_json$1(file) {
	return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function try_serialize(data) {
	try {
		return serialize(data);
	} catch (err) {
		return null;
	}
}

const { PORT = 3000, OUTPUT_DIR = 'dist' } = process.env;

const origin = `http://localhost:${PORT}`;

const app = express();

function read_json(file) {
	return JSON.parse(sander.readFileSync(file, { encoding: 'utf-8' }));
}

function exporter() {
	// Prep output directory
	sander.rimrafSync(OUTPUT_DIR);

	const { service_worker } = generate_asset_cache(
		read_json(path.join(dest, 'stats.client.json')),
		read_json(path.join(dest, 'stats.server.json'))
	);

	sander.copydirSync('assets').to(OUTPUT_DIR);
	sander.copydirSync(dest, 'client').to(OUTPUT_DIR, 'client');
	sander.writeFileSync(OUTPUT_DIR, 'service-worker.js', service_worker);

	// Intercept server route fetches
	function save(res) {
		res = res.clone();

		return res.text().then(body => {
			const { pathname } = new URL(res.url);
			let dest$$1 = OUTPUT_DIR + pathname;

			const type = res.headers.get('Content-Type');
			if (type.startsWith('text/html')) dest$$1 += '/index.html';

			sander.writeFileSync(dest$$1, body);

			return body;
		});
	}

	global.fetch = (url, opts) => {
		if (url[0] === '/') {
			url = `http://localhost:${PORT}${url}`;

			return fetch(url, opts)
				.then(r => {
					save(r);
					return r;
				});
		}

		return fetch(url, opts);
	};

	app.use(middleware());
	const server = app.listen(PORT);

	const seen = new Set();

	function handle(url) {
		if (url.origin !== origin) return;

		if (seen.has(url.pathname)) return;
		seen.add(url.pathname);

		return fetch(url.href)
			.then(r => {
				save(r);
				return r.text();
			})
			.then(body => {
				const $ = cheerio.load(body);
				const hrefs = [];

				$('a[href]').each((i, $a) => {
					hrefs.push($a.attribs.href);
				});

				return hrefs.reduce((promise, href) => {
					return promise.then(() => handle(new URL(href, url.href)));
				}, Promise.resolve());
			})
			.catch(err => {
				console.error(`Error rendering ${url.pathname}: ${err.message}`);
			});
	}

	return handle(new URL(origin)) // TODO all static routes
		.then(() => server.close());
}

const cmd = process.argv[2];
const start = Date.now();

if (cmd === 'build') {
	build()
		.then(() => {
			const elapsed = Date.now() - start;
			console.error(`built in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
		})
		.catch(err => {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		});
} else if (cmd === 'export') {
	const start = Date.now();

	build()
		.then(() => exporter())
		.then(() => {
			const elapsed = Date.now() - start;
			console.error(`extracted in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
		})
		.catch(err => {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		});
}
