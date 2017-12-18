const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const webpack = require('webpack');
const create_routes = require('./utils/create_routes.js');
const templates = require('./templates.js');
const create_app = require('./utils/create_app.js');
const create_compiler = require('./utils/create_compiler.js');
const escape_html = require('escape-html');
const { src, dest, dev } = require('./config.js');

module.exports = function connect(opts) {
	let routes = create_routes(
		glob.sync('**/*.+(html|js|mjs)', { cwd: src })
	);

	create_app(src, dest, routes, opts);

	const client = webpack(
		require(path.resolve('webpack.client.config.js'))
	);

	const server = webpack(
		require(path.resolve('webpack.server.config.js'))
	);

	const compiler = create_compiler(
		client,
		server,
		dest,
		routes,
		dev
	);

	const dev_middleware = dev ? require('webpack-dev-middleware')(client, {
		noInfo: true,
		logLevel: 'silent',
		publicPath: '/client/'
	}) : null;

	const hot_middleware = dev ? require('webpack-hot-middleware')(client, {
		reload: true,
		path: '/__webpack_hmr',
		heartbeat: 10 * 1000
	}) : null;

	async function handle_webpack_generated_files(url, req, res, next) {
		if (dev) {
			dev_middleware(req, res, () => {
				hot_middleware(req, res, next);
			});
		} else {
			if (url.startsWith('/client/')) {
				await compiler.ready;
				res.set({
					'Content-Type': 'application/javascript',
					'Cache-Control': 'max-age=31536000'
				});
				res.end(compiler.asset_cache[url]);
			} else {
				next();
			}
		}
	}

	async function handle_index(url, req, res, next) {
		if (url === '/index.html') {
			await compiler.ready;
			res.set({
				'Content-Type': 'text/html',
				'Cache-Control': dev ? 'no-cache' : 'max-age=600'
			});
			res.end(compiler.shell);
		} else {
			next();
		}
	}

	async function handle_service_worker(url, req, res, next) {
		if (url === '/service-worker.js') {
			await compiler.ready;
			res.set({
				'Content-Type': 'application/javascript',
				'Cache-Control': dev ? 'no-cache' : 'max-age=600'
			});
			res.end(compiler.service_worker);
		} else {
			next();
		}
	}

	async function handle_route(url, req, res, next) {
		// whatever happens, we're going to serve some HTML
		res.set({
			'Content-Type': 'text/html'
		});

		try {
			for (const route of routes) {
				if (route.test(url)) {
					await compiler.ready;

					req.params = route.exec(url);

					const mod = require(compiler.server_routes)[route.id];

					if (route.type === 'page') {
						let data = { params: req.params, query: req.query };
						if (mod.preload) data = Object.assign(data, await mod.preload(data));

						const { html, head, css } = mod.render(data);

						const page = templates.render(200, {
							main: compiler.client_main,
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

			res.status(404).end(templates.render(404, {
				title: 'Not found',
				status: 404,
				method: req.method,
				url
			}));
		} catch(err) {
			res.status(500).end(templates.render(500, {
				title: (err && err.name) || 'Internal server error',
				url,
				error: escape_html(err && (err.details || err.message || err) || 'Unknown error'),
				stack: err && err.stack.split('\n').slice(1).join('\n')
			}));
		}
	}

	return async function(req, res, next) {
		const url = req.url.replace(/\?.+/, '');

		handle_index(url, req, res, () => {
			handle_service_worker(url, req, res, () => {
				handle_webpack_generated_files(url, req, res, () => {
					handle_route(url, req, res, next);
				});
			});
		});
	};
};