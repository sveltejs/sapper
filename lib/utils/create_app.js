const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.resolve(__dirname, '../../templates/main.js'), 'utf-8');

module.exports = function create_app(src, dest, routes, options) {
	// TODO in dev mode, watch files

	const code = routes
		.filter(route => route.type === 'page')
		.map(route => {
			const params = route.dynamic.length === 0 ?
				'{}' :
				`{ ${route.dynamic.map((part, i) => `${part}: match[${i + 1}]`).join(', ') } }`;

			return `{ pattern: ${route.pattern}, params: match => (${params}), load: () => import(/* webpackChunkName: "${route.id}" */ '${src}/${route.file}') }`
		})
		.join(',\n\t');

	const main = template
		.replace('__app__', path.resolve(__dirname, '../../runtime/app.js'))
		.replace('__selector__', options.selector || 'main')
		.replace('__routes__', code);

	fs.writeFileSync(path.join(dest, 'main.js'), main);
};