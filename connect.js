require('svelte/ssr/register');
const esm = require('@std/esm');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const create_routes = require('./utils/create_routes.js');
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

	return async function(req, res, next) {
		const url = req.url.replace(/\?.+/, '');

		if (url.startsWith('/client/')) {
			fs.createReadStream(`${dest}${url}`).pipe(res);
			return;
		}

		for (const route of routes) {
			if (route.test(url)) {
				req.params = route.exec(url);

				const chunk = await webpack_compiler.get_chunk(route.id);
				const mod = require(chunk);

				if (route.type === 'page') {
					const main = await webpack_compiler.client_main;

					const page = opts.template({
						main,
						html: mod.default.render({
							params: req.params,
							query: req.query
						})
					});

					res.status(200);
					res.set({
						// TODO etag stuff
						'Content-Length': page.length,
						'Content-Type': 'text/html'
					});
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

		next();
	};
};