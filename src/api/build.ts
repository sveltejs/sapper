import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { EventEmitter } from 'events';
import minify_html from './utils/minify_html';
import { create_compilers, create_main_manifests, create_routes, create_serviceworker_manifest } from '../core';
import * as events from './interfaces';
import { copy_shimport } from './utils/copy_shimport';

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
	legacy,
	bundler,
	webpack = 'webpack',
	rollup = 'rollup',
	routes = 'routes'
} = {}) {
	rimraf.sync(path.join(dest, '**/*'));
	mkdirp.sync(`${dest}/client`);
	copy_shimport(dest);

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
	create_main_manifests({ bundler, routes: route_objects });

	const { client, server, serviceworker } = create_compilers(bundler, { webpack, rollup });

	const client_result = await client.compile();
	emitter.emit('build', <events.BuildEvent>{
		type: 'client',
		// TODO duration/warnings
		result: client_result
	});

	const build_info: {
		bundler: string;
		shimport: string;
		assets: Record<string, string>;
		legacy_assets?: Record<string, string>;
	} = {
		bundler,
		shimport: bundler === 'rollup' && require('shimport/package.json').version,
		assets: client_result.assets
	};

	if (legacy) {
		process.env.SAPPER_LEGACY_BUILD = 'true';
		const { client } = create_compilers(bundler, { webpack, rollup });

		const client_result = await client.compile();

		emitter.emit('build', <events.BuildEvent>{
			type: 'client (legacy)',
			// TODO duration/warnings
			result: client_result
		});

		build_info.legacy_assets = client_result.assets;
		delete process.env.SAPPER_LEGACY_BUILD;
	}

	fs.writeFileSync(path.join(dest, 'build.json'), JSON.stringify(build_info));

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
			client_files: client_result.chunks.map((file: string) => `client/${file}`)
		});

		serviceworker_stats = await serviceworker.compile();

		emitter.emit('build', <events.BuildEvent>{
			type: 'serviceworker',
			// TODO duration/warnings
			result: serviceworker_stats
		});
	}
}