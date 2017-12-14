const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.resolve(__dirname, '../templates/main.js'), 'utf-8');

module.exports = function create_app(src, dest, routes, options) {
	// TODO in dev mode, watch files

	const code = routes
		.filter(route => route.type === 'page')
		.map(route => {
			const condition = route.dynamic.length === 0 ?
				`url.pathname === '/${route.parts.join('/')}'` :
				`match = ${route.pattern}.exec(url.pathname)`;

			const lines = [];

			route.dynamic.forEach((part, i) => {
				lines.push(
					`params.${part} = match[${i + 1}];`
				);
			});

			lines.push(
				`import('${src}/${route.file}').then(render);`
			);

			return `
				if (${condition}) {
					${lines.join(`\n\t\t\t\t\t`)}
				}
			`.replace(/^\t{3}/gm, '').trim();
		})
		.join(' else ') + ' else return false;';

	const main = template
		.replace('__app__', path.resolve(__dirname, '../runtime/app.js'))
		.replace('__selector__', options.selector || 'main')
		.replace('// ROUTES', code);

	fs.writeFileSync(path.join(dest, 'main.js'), main);
};