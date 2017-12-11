require('svelte/ssr/register');
const esm = require('@std/esm');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const tmp = require('tmp');
const create_matchers = require('./utils/create_matchers.js');
const create_app = require('./utils/create_app.js');
const create_webpack_compiler = require('./utils/create_webpack_compiler.js');

const esmRequire = esm(module, {
	esm: 'all'
});

const dir = tmp.dirSync({ unsafeCleanup: true });

module.exports = function connect(opts) {
	const routes = path.resolve('routes');
	const out = path.resolve('.sapper');

	let pages = glob.sync('**/*.html', { cwd: routes });
	let page_matchers = create_matchers(pages);

	let server_routes = glob.sync('**/*.+(js|mjs)', { cwd: routes });
	let server_route_matchers = create_matchers(server_routes);

	// create_app(routes, dir.name, page_matchers, opts.dev);
	create_app(routes, out, page_matchers, opts.dev);

	const webpack_compiler = create_webpack_compiler(
		path.join(out, 'main.js'),
		path.resolve('.sapper/webpack'),
		opts.dev
	);

	return async function(req, res, next) {
		const url = req.url.replace(/\?.+/, '');

		if (url.startsWith('/webpack/')) {
			fs.createReadStream(path.resolve('.sapper' + url)).pipe(res);
			return;
		}

		for (let i = 0; i < page_matchers.length; i += 1) {
			const matcher = page_matchers[i];
			if (matcher.test(url)) {
				const params = matcher.exec(url);
				const Component = require(`${routes}/${matcher.file}`);

				const app = await webpack_compiler.app;

				const page = opts.template({
					app,
					html: Component.render({
						params,
						query: req.query
					})
				});

				res.end(page);
				return;
			}
		}

		for (let i = 0; i < server_route_matchers.length; i += 1) {
			const matcher = server_route_matchers[i];
			if (matcher.test(url)) {
				req.params = matcher.exec(url);
				const route = esmRequire(`${routes}/${matcher.file}`);

				const handler = route[req.method.toLowerCase()];
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

					return;
				}
			}
		}

		next();
	};
};

