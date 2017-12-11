require('svelte/ssr/register');
const esm = require('@std/esm');
const path = require('path');
const glob = require('glob');
const create_matchers = require('./utils/create_matchers.js');

require = esm(module, {
	esm: 'all'
});

module.exports = function connect(opts = {}) {
	const routes = path.resolve('routes');
	const out = path.resolve('.sapper');

	let pages = glob.sync('**/*.html', { cwd: routes });
	let page_matchers = create_matchers(pages);

	let server_routes = glob.sync('**/*.+(js|mjs)', { cwd: routes });
	let server_route_matchers = create_matchers(server_routes);

	return async function(req, res, next) {
		const url = req.url.replace(/\?.+/, '');

		for (let i = 0; i < page_matchers.length; i += 1) {
			const matcher = page_matchers[i];
			if (matcher.test(url)) {
				const params = matcher.exec(url);
				const Component = require(`${routes}/${matcher.file}`);

				res.end(Component.render({
					params,
					query: req.query
				}));
				return;
			}
		}

		for (let i = 0; i < server_route_matchers.length; i += 1) {
			const matcher = server_route_matchers[i];
			if (matcher.test(url)) {
				req.params = matcher.exec(url);
				const route = require(`${routes}/${matcher.file}`);

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

