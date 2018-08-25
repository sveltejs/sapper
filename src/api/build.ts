import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { EventEmitter } from 'events';
import minify_html from './utils/minify_html';
import { create_compilers, create_main_manifests, create_routes, create_serviceworker_manifest } from '../core';
import { Compilers, Compiler } from '../core/create_compilers';
import * as events from './interfaces';

export function build(opts: {}) {
	const emitter = new EventEmitter();

	execute(emitter, opts).then(
		() => {
			emitter.emit('done', <events.DoneEvent>{}); // TODO do we need to pass back any info?
		},
		error => {
			emitter.emit('error', <events.ErrorEvent>{
				error
			});
		}
	);

	return emitter;
}

async function execute(emitter: EventEmitter, {
	dest = 'build',
	app = 'app',
	webpack = 'webpack',
	rollup = 'rollup',
	routes = 'routes'
} = {}) {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));

	// minify app/template.html
	// TODO compile this to a function? could be quicker than str.replace(...).replace(...).replace(...)
	const template = fs.readFileSync(`${app}/template.html`, 'utf-8');

	// remove this in a future version
	if (template.indexOf('%sapper.base%') === -1) {
		const error = new Error(`As of Sapper v0.10, your template.html file must include %sapper.base% in the <head>`);
		error.code = `missing-sapper-base`;
		throw error;
	}

	fs.writeFileSync(`${dest}/template.html`, minify_html(template));

	const route_objects = create_routes();

	// create app/manifest/client.js and app/manifest/server.js
	create_main_manifests({ routes: route_objects });

	const { client, server, serviceworker } = create_compilers({ webpack, rollup });

	const client_result = await client.compile();
	emitter.emit('build', <events.BuildEvent>{
		type: 'client',
		// TODO duration/warnings
		result: client_result
	});

	fs.writeFileSync(path.join(dest, 'client_assets.json'), JSON.stringify(client_result.assetsByChunkName));

	const server_stats = await server.compile();
	emitter.emit('build', <events.BuildEvent>{
		type: 'server',
		// TODO duration/warnings
		result: server_stats
	});

	let serviceworker_stats;

	if (serviceworker) {
		create_serviceworker_manifest({
			routes: route_objects,
			client_files: client_result.assets.map((chunk: { name: string }) => `client/${chunk.name}`)
		});

		serviceworker_stats = await serviceworker.compile();

		emitter.emit('build', <events.BuildEvent>{
			type: 'serviceworker',
			// TODO duration/warnings
			result: serviceworker_stats
		});
	}
}