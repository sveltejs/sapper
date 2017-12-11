const fs = require('fs');
const path = require('path');
const tmp = require('tmp');

const template = fs.readFileSync(path.resolve(__dirname, '../templates/main.js'), 'utf-8');

module.exports = function create_app(routes, dest, matchers, dev) {
	// TODO in dev mode, watch files

	const code = matchers
		.map(matcher => {
			const condition = matcher.dynamic.length === 0 ?
				`url.pathname === '/${matcher.parts.join('/')}'` :
				`${matcher.pattern}.test(url.pathname)`;

			return `
				if (${condition}) {
					// TODO set params, if applicable
					import('${routes}/${matcher.file}').then(render);
				}
			`.replace(/^\t{3}/gm, '').trim();
		})
		.join(' else ');

	const main = template.replace('// ROUTES', code);

	fs.writeFileSync(path.join(dest, 'main.js'), main);
};