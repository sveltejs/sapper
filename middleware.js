'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var path = require('path');
var serialize = _interopDefault(require('serialize-javascript'));
var escape_html = _interopDefault(require('escape-html'));
var core_js = require('./core.js');
var chalk = _interopDefault(require('chalk'));
var mkdirp = _interopDefault(require('mkdirp'));
var rimraf = _interopDefault(require('rimraf'));

const dev = process.env.NODE_ENV !== 'production';

const templates$1 = path.resolve(process.env.SAPPER_TEMPLATES || 'templates');

const src = path.resolve(process.env.SAPPER_ROUTES || 'routes');

const dest = path.resolve(process.env.SAPPER_DEST || '.sapper');

if (dev) {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));
}

const entry = {
	client: path.resolve(templates$1, '.main.rendered.js'),
	server: path.resolve(dest, 'server-entry.js')
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

		return core_js.generate_asset_cache(
			client_stats.toJson(),
			server_stats.toJson()
		);
	});

	function watch_compiler(type) {
		const compiler = core_js.compilers[type];

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
	core_js.create_app();

	const watcher = create_watcher();

	let asset_cache;

	const middleware = compose_handlers([
		require('webpack-hot-middleware')(core_js.compilers.client, {
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
	const asset_cache = core_js.generate_asset_cache(
		read_json(path.join(dest, 'stats.client.json')),
		read_json(path.join(dest, 'stats.server.json'))
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

var index = dev ? connect_dev : connect_prod;

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
	function handle_route(route, req, res, next, { client, server }) {
		req.params = route.exec(req.pathname);

		const mod = require(server.entry)[route.id];

		if (route.type === 'page') {
			// preload main.js and current route
			// TODO detect other stuff we can preload? images, CSS, fonts?
			res.setHeader('Link', `<${client.main_file}>;rel="preload";as="script", <${client.routes[route.id]}>;rel="preload";as="script"`);

			const data = { params: req.params, query: req.query };

			if (mod.preload) {
				const promise = Promise.resolve(mod.preload(req)).then(preloaded => {
					const serialized = try_serialize(preloaded);
					Object.assign(data, preloaded);

					return { rendered: mod.render(data), serialized };
				});

				return core_js.templates.stream(res, 200, {
					scripts: promise.then(({ serialized }) => {
						const main = `<script src='${client.main_file}'></script>`;

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

				const page = core_js.templates.render(200, {
					scripts: `<script src='${client.main_file}'></script>`,
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
				for (const route of core_js.route_manager.routes) {
					if (route.test(url)) return handle_route(route, req, res, next, fn());
				}

				// no matching route — 404
				next();
			})
			.catch(err => {
				res.statusCode = 500;
				res.end(core_js.templates.render(500, {
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
		res.end(core_js.templates.render(404, {
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

function read_json(file) {
	return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function try_serialize(data) {
	try {
		return serialize(data);
	} catch (err) {
		return null;
	}
}

module.exports = index;
