const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.resolve(__dirname, '../templates/main.js'), 'utf-8');

module.exports = function create_app(routes, dest, matchers, dev) {
	// TODO in dev mode, watch files

	const code = matchers
		.map(matcher => {
			const condition = matcher.dynamic.length === 0 ?
				`url.pathname === '/${matcher.parts.join('/')}'` :
				`match = ${matcher.pattern}.exec(url.pathname)`;

			const lines = [];

			matcher.dynamic.forEach((part, i) => {
				lines.push(
					`params.${part} = match[${i + 1}];`
				);
			});

			lines.push(
				`import('${routes}/${matcher.file}').then(render);`
			);

			return `
				if (${condition}) {
					${lines.join(`\n\t\t\t\t\t`)}
				}
			`.replace(/^\t{3}/gm, '').trim();
		})
		.join(' else ');

	const main = template.replace('// ROUTES', code);

	fs.writeFileSync(path.join(dest, 'main.js'), main);
};