import * as fs from 'fs';
import * as path from 'path';
import glob from 'tiny-glob/sync.js';
import { posixify, write_if_changed } from './utils';
import { dev, locations } from '../config';
import { Page, PageComponent, ServerRoute, ManifestData } from '../interfaces';

export function create_main_manifests({ bundler, manifest_data, dev_port }: {
	bundler: string,
	manifest_data: ManifestData;
	dev_port?: number;
}) {
	const manifest_dir = path.join(locations.app(), 'manifest');
	if (!fs.existsSync(manifest_dir)) fs.mkdirSync(manifest_dir);

	const path_to_routes = path.relative(manifest_dir, locations.routes());

	const client_manifest = generate_client(manifest_data, path_to_routes, bundler, dev_port);
	const server_manifest = generate_server(manifest_data, path_to_routes);

	write_if_changed(
		`${manifest_dir}/default-layout.html`,
		`<svelte:component this={child.component} {...child.props}/>`
	);
	write_if_changed(`${manifest_dir}/client.js`, client_manifest);
	write_if_changed(`${manifest_dir}/server.js`, server_manifest);
}

export function create_serviceworker_manifest({ manifest_data, client_files }: {
	manifest_data: ManifestData;
	client_files: string[];
}) {
	const assets = glob('**', { cwd: 'assets', filesOnly: true });

	let code = `
		// This file is generated by Sapper — do not edit it!
		export const timestamp = ${process.env.SAPPER_TIMESTAMP || Date.now()};

		export const assets = [\n\t${assets.map((x: string) => `"${x}"`).join(',\n\t')}\n];

		export const shell = [\n\t${client_files.map((x: string) => `"${x}"`).join(',\n\t')}\n];

		export const routes = [\n\t${manifest_data.pages.map((r: Page) => `{ pattern: ${r.pattern} }`).join(',\n\t')}\n];
	`.replace(/^\t\t/gm, '').trim();

	write_if_changed(`${locations.app()}/manifest/service-worker.js`, code);
}

function generate_client(
	manifest_data: ManifestData,
	path_to_routes: string,
	bundler: string,
	dev_port?: number
) {
	const page_ids = new Set(manifest_data.pages.map(page =>
		page.pattern.toString()));

	const server_routes_to_ignore = manifest_data.server_routes.filter(route =>
		!page_ids.has(route.pattern.toString()));

	let code = `
		// This file is generated by Sapper — do not edit it!
		import root from '${get_file(path_to_routes, manifest_data.root)}';
		import error from '${posixify(`${path_to_routes}/_error.html`)}';

		const d = decodeURIComponent;

		${manifest_data.components.map(component => {
			const annotation = bundler === 'webpack'
				? `/* webpackChunkName: "${component.name}" */ `
				: '';

			const source = get_file(path_to_routes, component);

			return `const ${component.name} = {
			js: () => import(${annotation}'${source}'),
			css: "__SAPPER_CSS_PLACEHOLDER:${component.file}__"
		};`;
		}).join('\n')}

		export const manifest = {
			ignore: [${server_routes_to_ignore.map(route => route.pattern).join(', ')}],

			pages: [
				${manifest_data.pages.map(page => `{
					// ${page.parts[page.parts.length - 1].component.file}
					pattern: ${page.pattern},
					parts: [
						${page.parts.map(part => {
							if (part === null) return 'null';

							if (part.params.length > 0) {
								const props = part.params.map((param, i) => `${param}: d(match[${i + 1}])`);
								return `{ component: ${part.component.name}, params: match => ({ ${props.join(', ')} }) }`;
							}

							return `{ component: ${part.component.name} }`;
						}).join(',\n\t\t\t\t\t\t')}
					]
				}`).join(',\n\n\t\t\t\t')}
			],

			root,

			error
		};

		// this is included for legacy reasons
		export const routes = {};`.replace(/^\t\t/gm, '').trim();

	if (dev()) {
		const sapper_dev_client = posixify(
			path.resolve(__dirname, '../sapper-dev-client.js')
		);

		code += `

			import('${sapper_dev_client}').then(client => {
				client.connect(${dev_port});
			});`.replace(/^\t{3}/gm, '');
	}

	return code;
}

function generate_server(
	manifest_data: ManifestData,
	path_to_routes: string
) {
	const imports = [].concat(
		manifest_data.server_routes.map(route =>
			`import * as ${route.name} from '${posixify(`${path_to_routes}/${route.file}`)}';`),
		manifest_data.components.map(component =>
			`import ${component.name} from '${get_file(path_to_routes, component)}';`),
		`import root from '${get_file(path_to_routes, manifest_data.root)}';`,
		`import error from '${posixify(`${path_to_routes}/_error.html`)}';`
	);

	let code = `
		// This file is generated by Sapper — do not edit it!
		${imports.join('\n')}

		const d = decodeURIComponent;

		export const manifest = {
			server_routes: [
				${manifest_data.server_routes.map(route => `{
					// ${route.file}
					pattern: ${route.pattern},
					handlers: ${route.name},
					params: ${route.params.length > 0
						? `match => ({ ${route.params.map((param, i) => `${param}: d(match[${i + 1}])`).join(', ')} })`
						: `() => ({})`}
				}`).join(',\n\n\t\t\t\t')}
			],

			pages: [
				${manifest_data.pages.map(page => `{
					// ${page.parts[page.parts.length - 1].component.file}
					pattern: ${page.pattern},
					parts: [
						${page.parts.map(part => {
							if (part === null) return 'null';

							const props = [
								`name: "${part.component.name}"`,
								`file: "${part.component.file}"`,
								`component: ${part.component.name}`
							];

							if (part.params.length > 0) {
								const params = part.params.map((param, i) => `${param}: d(match[${i + 1}])`);
								props.push(`params: match => ({ ${params.join(', ')} })`);
							}

							return `{ ${props.join(', ')} }`;
						}).join(',\n\t\t\t\t\t\t')}
					]
				}`).join(',\n\n\t\t\t\t')}
			],

			root,

			error
		};

		// this is included for legacy reasons
		export const routes = {};`.replace(/^\t\t/gm, '').trim();

	return code;
}

function get_file(path_to_routes: string, component: PageComponent) {
	if (component.default) {
		return `./default-layout.html`;
	}

	return posixify(`${path_to_routes}/${component.file}`);
}