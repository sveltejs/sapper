import * as fs from 'fs';
import * as path from 'path';
import * as route_manager from '../route_manager.js';
import * as templates from '../templates.js';

function posixify(file) {
	return file.replace(/[/\\]/g, '/');
}

function create_app({ src, dev, entry }) {
	// const { routes } = route_manager;
	route_manager.update({ src });
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
			const hmr_client = posixify(require.resolve(`webpack-hot-middleware/client`));
			main += `\n\nimport('${hmr_client}?path=/__webpack_hmr&timeout=20000'); if (module.hot) module.hot.accept();`
		}

		fs.writeFileSync(entry.client, main);

		// need to fudge the mtime, because webpack is soft in the head
		const { atime, mtime } = fs.statSync(entry.client);
		fs.utimesSync(entry.client, new Date(atime.getTime() - 999999), new Date(mtime.getTime() - 999999));
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

		fs.writeFileSync(entry.server, `${imports}\n\n${exports}`);

		const { atime, mtime } = fs.statSync(entry.server);
		fs.utimesSync(entry.server, new Date(atime.getTime() - 999999), new Date(mtime.getTime() - 999999));
	}

	create_client_main();
	create_server_routes();
}

export function start_watching({ src }) {
	const chokidar = require('chokidar');

	const watch = (glob, callback) => {
		const watcher = chokidar.watch(glob, {
			ignoreInitial: true,
			persistent: false
		});

		watcher.on('add', callback);
		watcher.on('change', callback);
		watcher.on('unlink', callback);
	};

	watch('templates/main.js', create_app);

	watch('routes/**/*.+(html|js|mjs)', () => {
		route_manager.update({ src });
		create_app();
	});

	watch('templates/**.html', () => {
		templates.create_templates();
		// TODO reload current page?
	});
}

export default create_app;
