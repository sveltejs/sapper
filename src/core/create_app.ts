import * as fs from 'fs';
import * as path from 'path';
import create_routes from './create_routes';

function posixify(file: string) {
	return file.replace(/[/\\]/g, '/');
}

function fudge_mtime(file: string) {
	// need to fudge the mtime so that webpack doesn't go doolally
	const { atime, mtime } = fs.statSync(file);
	fs.utimesSync(
		file,
		new Date(atime.getTime() - 999999),
		new Date(mtime.getTime() - 999999)
	);
}

function create_app({ src, dev, entry }: {
	src: string;
	dev: boolean;
	entry: { client: string; server: string };
}) {
	const routes = create_routes({ src });

	function create_client_main() {
		const code = `[${routes
			.filter(route => route.type === 'page')
			.map(route => {
				const params =
					route.dynamic.length === 0
						? '{}'
						: `{ ${route.dynamic
								.map((part, i) => `${part}: match[${i + 1}]`)
								.join(', ')} }`;

				const file = posixify(`${src}/${route.file}`);
				return `{ pattern: ${
					route.pattern
				}, params: match => (${params}), load: () => import(/* webpackChunkName: "${
					route.id
				}" */ '${file}') }`;
			})
			.join(', ')}]`;

		let main = fs
			.readFileSync('templates/main.js', 'utf-8')
			.replace(
				/__app__/g,
				posixify(path.resolve(__dirname, '../../runtime/app.js'))
			)
			.replace(/__routes__/g, code)
			.replace(/__dev__/g, String(dev));

		if (dev) {
			const hmr_client = posixify(
				require.resolve(`webpack-hot-middleware/client`)
			);
			main += `\n\nimport('${hmr_client}?path=/__webpack_hmr&timeout=20000'); if (module.hot) module.hot.accept();`;
		}

		fs.writeFileSync(entry.client, main);
		fudge_mtime(entry.client);
	}

	function create_server_routes() {
		const imports = routes
			.map(route => {
				const file = posixify(`${src}/${route.file}`);
				return route.type === 'page'
					? `import ${route.id} from '${file}';`
					: `import * as ${route.id} from '${file}';`;
			})
			.join('\n');

		const exports = `export { ${routes.map(route => route.id)} };`;

		fs.writeFileSync(entry.server, `${imports}\n\n${exports}`);
		fudge_mtime(entry.server);
	}

	create_client_main();
	create_server_routes();
}

export default create_app;
