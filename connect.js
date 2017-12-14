require('svelte/ssr/register');
const esm = require('@std/esm');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const create_routes = require('./utils/create_routes.js');
const create_templates = require('./utils/create_templates.js');
const create_app = require('./utils/create_app.js');
const create_webpack_compiler = require('./utils/create_webpack_compiler.js');

const esmRequire = esm(module, {
	esm: 'js'
});

module.exports = function connect(opts) {
	const src = path.resolve('routes');
	const dest = path.resolve(opts.tmpDir || '.sapper');

	rimraf.sync(dest);
	fs.mkdirSync(dest);

	let routes = create_routes(
		glob.sync('**/*.+(html|js|mjs)', { cwd: src })
	);

	create_app(src, dest, routes, opts);

	const webpack_compiler = create_webpack_compiler(
		dest,
		routes,
		opts.dev
	);

	const templates = create_templates();

	return async function(req, res, next) {
		const url = req.url.replace(/\?.+/, '');

		if (url.startsWith('/client/')) {
			res.set({
				'Content-Type': 'application/javascript'
			});
			fs.createReadStream(`${dest}${url}`).pipe(res);
			return;
		}

		// whatever happens, we're going to serve some HTML
		res.set({
			'Content-Type': 'text/html'
		});

		try {
			for (const route of routes) {
				if (route.test(url)) {
					req.params = route.exec(url);

					const chunk = await webpack_compiler.get_chunk(route.id);
					const mod = require(chunk);

					if (route.type === 'page') {
						const main = await webpack_compiler.client_main;

						let data = { params: req.params, query: req.query };
						if (mod.default.preload) data = Object.assign(data, await mod.default.preload(data));

						const { html, head, css } = mod.default.render(data);

						const page = templates.render(200, {
							main,
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
				status: 404,
				url
			}));
		} catch(err) {
			// TODO nice error pages
			res.status(500);
			res.end(err.stack);
		}
	};
};