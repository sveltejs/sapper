const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const webpack = require('webpack');
const route_manager = require('./route_manager.js');
const templates = require('./templates.js');
const create_app = require('./utils/create_app.js');
const create_watcher = require('./utils/create_watcher.js');
const compilers = require('./utils/compilers.js');
const generate_asset_cache = require('./utils/generate_asset_cache.js');
const escape_html = require('escape-html');
const { src, dest, dev } = require('./config.js');

function connect_dev() {
	// create main.js and server-routes.js
	// TODO update on changes
	create_app();

	const watcher = create_watcher();

	let asset_cache;

	return compose_handlers([
		require('webpack-hot-middleware')(compilers.client, {
			reload: true,
			path: '/__webpack_hmr',
			heartbeat: 10 * 1000
		}),

		async (req, res, next) => {
			asset_cache = await watcher.ready;
			next();
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

		not_found
	]);
}

function connect_prod() {
	const asset_cache = generate_asset_cache(
		read_json(path.join(dest, 'stats.client.json')),
		read_json(path.join(dest, 'stats.server.json'))
	);

	return compose_handlers([
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

		not_found
	]);
}

module.exports = dev ? connect_dev : connect_prod;

function set_req_pathname(req, res, next) {
	req.pathname = req.url.replace(/\?.+/, '');
	next();
}

function get_asset_handler(opts) {
	return (req, res, next) => {
		if (!opts.filter(req.pathname)) return next();

		res.set({
			'Content-Type': opts.type,
			'Cache-Control': opts.cache
		});
		res.end(opts.fn(req.pathname));
	};
}

function get_route_handler(fn) {
	return async function handle_route(req, res, next) {
		const url = req.pathname;

		const { client, server } = fn();

		// whatever happens, we're going to serve some HTML
		res.set({
			'Content-Type': 'text/html'
		});

		try {
			for (const route of route_manager.routes) {
				if (route.test(url)) {
					req.params = route.exec(url);

					const mod = require(server.entry)[route.id];

					if (route.type === 'page') {
						let data = { params: req.params, query: req.query };
						if (mod.preload) data = Object.assign(data, await mod.preload(data));

						const { html, head, css } = mod.render(data);

						const page = templates.render(200, {
							main: client.main_file,
							html,
							head: `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`,
							styles: (css && css.code ? `<style>${css.code}</style>` : '')
						});

						res.status(200);
						res.end(page);
					}

					else {
						const handler = mod[req.method.toLowerCase()];
						if (handler) handler(req, res, next);
					}

					return;
				}
			}

			next();
		} catch(err) {
			res.status(500).end(templates.render(500, {
				title: (err && err.name) || 'Internal server error',
				url,
				error: escape_html(err && (err.details || err.message || err) || 'Unknown error'),
				stack: err && err.stack.split('\n').slice(1).join('\n')
			}));
		}
	}
}

function not_found(req, res) {
	res.status(404).end(templates.render(404, {
		title: 'Not found',
		status: 404,
		method: req.method,
		url
	}));
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
	}
}

function read_json(file) {
	return JSON.parse(fs.readFileSync(file, 'utf-8'));
}