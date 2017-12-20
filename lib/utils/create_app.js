const fs = require('fs');
const path = require('path');
const route_manager = require('../route_manager.js');
const { src, dest, server_routes, dev } = require('../config.js');

function posixify(file) {
	return file.replace(/[\/\\]/g, '/');
}

module.exports = function create_app() {
	const { routes } = route_manager;

	function create_client_main() {
		const template = fs.readFileSync('templates/main.js', 'utf-8');

		const code = `[${
			routes
				.filter(route => route.type === 'page')
				.map(route => {
					const params = route.dynamic.length === 0 ?
						'{}' :
						`{ ${route.dynamic.map((part, i) => `${part}: match[${i + 1}]`).join(', ') } }`;

					const file = posixify(`${src}/${route.file}`);
					return `{ pattern: ${route.pattern}, params: match => (${params}), load: () => import(/* webpackChunkName: "${route.id}" */ '${file}') }`
				})
				.join(', ')
		}]`;

		let main = template
			.replace(/__app__/g, posixify(path.resolve(__dirname, '../../runtime/app.js')))
			.replace(/__routes__/g, code)
			.replace(/__dev__/g, String(dev));

		if (dev) {
			const hmr_client = require.resolve(`webpack-hot-middleware/client`);
			main += `\n\nimport('${hmr_client}?path=/__webpack_hmr&timeout=20000'); if (module.hot) module.hot.accept();`
		}

		const file = path.resolve(dest, 'main.js');

		fs.writeFileSync(file, main);

		// need to fudge the mtime, because webpack is soft in the head
		const { atime, mtime } = fs.statSync(file);
		fs.utimesSync(file, new Date(atime.getTime() - 999999), new Date(mtime.getTime() - 999999));
	}

	function create_server_routes() {
		const imports = routes
			.map(route => {
				const file = posixify(`${src}/${route.file}`);
				return route.type === 'page' ?
					`import ${route.id} from '${file}';` :
					`import * as ${route.id} from '${file}';`;
			})
			.join('\n');

		const exports = `export { ${routes.map(route => route.id)} };`;

		fs.writeFileSync(server_routes, `${imports}\n\n${exports}`);

		const { atime, mtime } = fs.statSync(server_routes);
		fs.utimesSync(server_routes, new Date(atime.getTime() - 999999), new Date(mtime.getTime() - 999999));
	}

	// TODO in dev mode, watch files
	create_client_main();
	create_server_routes();
};