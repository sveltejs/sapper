import * as fs from 'fs';
import * as path from 'path';
import * as clorox from 'clorox';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { minify_html } from './utils/minify_html';
import { create_compilers, create_main_manifests, create_routes, create_serviceworker_manifest } from '../core'
import { locations } from '../config';

export async function build() {
	const output = locations.dest();

	mkdirp.sync(output);
	rimraf.sync(path.join(output, '**/*'));

	const routes = create_routes();

	// create app/manifest/client.js and app/manifest/server.js
	create_main_manifests({ routes });

	const { client, server, serviceworker } = create_compilers();

	const client_stats = await compile(client);
	console.log(clorox.inverse(`\nbuilt client`).toString());
	console.log(client_stats.toString({ colors: true }));
	fs.writeFileSync(path.join(output, 'client_info.json'), JSON.stringify(client_stats.toJson()));

	const server_stats = await compile(server);
	console.log(clorox.inverse(`\nbuilt server`).toString());
	console.log(server_stats.toString({ colors: true }));

	let serviceworker_stats;

	if (serviceworker) {
		create_serviceworker_manifest({
			routes,
			client_files: client_stats.toJson().assets.map((chunk: { name: string }) => `/client/${chunk.name}`)
		});

		serviceworker_stats = await compile(serviceworker);
		console.log(clorox.inverse(`\nbuilt service worker`).toString());
		console.log(serviceworker_stats.toString({ colors: true }));
	}

	// minify app/template.html
	// TODO compile this to a function? could be quicker than str.replace(...).replace(...).replace(...)
	const template = fs.readFileSync(`${locations.app()}/template.html`, 'utf-8');
	fs.writeFileSync(`${output}/template.html`, minify_html(template));
}

function compile(compiler: any) {
	return new Promise((fulfil, reject) => {
		compiler.run((err: Error, stats: any) => {
			if (err) {
				reject(err);
				process.exit(1);
			}

			if (stats.hasErrors()) {
				console.error(stats.toString({ colors: true }));
				reject(new Error(`Encountered errors while building app`));
			}

			else {
				fulfil(stats);
			}
		});
	});
}
