const fs = require('fs');
const path = require('path');
const { main_built } = require('../config.js');

const template = fs.readFileSync('templates/main.js', 'utf-8');

module.exports = function create_app(src, dest, routes, options) {
	// TODO in dev mode, watch files

	const code = `[${
		routes
			.filter(route => route.type === 'page')
			.map(route => {
				const params = route.dynamic.length === 0 ?
					'{}' :
					`{ ${route.dynamic.map((part, i) => `${part}: match[${i + 1}]`).join(', ') } }`;

				return `{ pattern: ${route.pattern}, params: match => (${params}), load: () => import(/* webpackChunkName: "${route.id}" */ '${src}/${route.file}') }`
			})
			.join(', ')
	}]`;

	const main = template.replace('__routes__', code);

	fs.writeFileSync(main_built, main);

	// need to fudge the mtime, because webpack is soft in the head
	const stats = fs.statSync(main_built);
	fs.utimesSync(main_built, stats.atimeMs - 9999, stats.mtimeMs - 9999);
};