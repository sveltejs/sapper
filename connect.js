require('svelte/ssr/register');
const esm = require('@std/esm');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const create_routes = require('./lib/utils/create_routes.js');
const templates = require('./lib/templates.js');
const create_app = require('./lib/utils/create_app.js');
const create_compiler = require('./lib/utils/create_compiler.js');
const escape_html = require('escape-html');
const { src, dest, dev } = require('./lib/config.js');

const esmRequire = esm(module, {
	esm: 'js'
});

module.exports = function connect(opts) {
	mkdirp(dest);
	rimraf.sync(path.join(dest, '**/*'));

	let routes = create_routes(
		glob.sync('**/*.+(html|js|mjs)', { cwd: src })
	);

	create_app(src, dest, routes, opts);

	const compiler = create_compiler(
		dest,
		routes,
		dev
	);

	return async function(req, res, next) {
		const url = req.url.replace(/\?.+/, '');

		if (url === '/service-worker.js') {
			await compiler.ready;
			res.set({
				'Content-Type': 'application/javascript',
				'Cache-Control': dev ? 'no-cache' : 'max-age=600'
			});
			res.end(compiler.service_worker);
		}

		else if (url === '/index.html') {
			await compiler.ready;
			res.set({
				'Content-Type': 'text/html',
				'Cache-Control': dev ? 'no-cache' : 'max-age=600'
			});
			res.end(compiler.shell);
		}

		else if (url.startsWith('/client/')) {
			await compiler.ready;
			res.set({
				'Content-Type': 'application/javascript',
				'Cache-Control': 'max-age=31536000'
			});
			res.end(compiler.asset_cache[url]);
		}

		else {
			// whatever happens, we're going to serve some HTML
			res.set({
				'Content-Type': 'text/html'
			});

			try {
				for (const route of routes) {
					if (route.test(url)) {
						await compiler.ready;

						req.params = route.exec(url);

						const chunk = compiler.chunks[route.id];
						const mod = require(path.resolve(dest, 'server', chunk));

						if (route.type === 'page') {
							let data = { params: req.params, query: req.query };
							if (mod.default.preload) data = Object.assign(data, await mod.default.preload(data));

							const { html, head, css } = mod.default.render(data);

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
							if (handler) {
								if (handler.length === 2) {
									handler(req, res);
								} else {
									const data = await handler(req);

									// TODO headers, error handling
									if (typeof data === 'string') {
										res.end(data);
									} else {
										res.end(JSON.stringify(data));
									}
								}
							}
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
					title: err.name || 'Internal server error',
					url,
					error: escape_html(err.details || err.message || err || 'Unknown error')
				}));
			}
		}
	};
};