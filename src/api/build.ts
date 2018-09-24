import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { EventEmitter } from 'events';
import * as codec from 'sourcemap-codec';
import hash from 'string-hash';
import minify_html from './utils/minify_html';
import { create_compilers, create_main_manifests, create_manifest_data, create_serviceworker_manifest } from '../core';
import * as events from './interfaces';
import { copy_shimport } from './utils/copy_shimport';
import { Dirs, PageComponent } from '../interfaces';
import { CompileResult } from '../core/create_compilers/interfaces';
import read_template from '../core/read_template';

type Opts = {
	legacy: boolean;
	bundler: string;
};

export function build(opts: Opts, dirs: Dirs) {
	const emitter = new EventEmitter();

	execute(emitter, opts, dirs).then(
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

async function execute(emitter: EventEmitter, opts: Opts, dirs: Dirs) {
	rimraf.sync(path.join(dirs.dest, '**/*'));
	mkdirp.sync(`${dirs.dest}/client`);
	copy_shimport(dirs.dest);

	// minify src/template.html
	// TODO compile this to a function? could be quicker than str.replace(...).replace(...).replace(...)
	const template = read_template();

	// remove this in a future version
	if (template.indexOf('%sapper.base%') === -1) {
		const error = new Error(`As of Sapper v0.10, your template.html file must include %sapper.base% in the <head>`);
		error.code = `missing-sapper-base`;
		throw error;
	}

	fs.writeFileSync(`${dirs.dest}/template.html`, minify_html(template));

	const manifest_data = create_manifest_data();

	// create src/manifest/client.js and src/manifest/server.js
	create_main_manifests({ bundler: opts.bundler, manifest_data });

	const { client, server, serviceworker } = await create_compilers(opts.bundler, dirs);

	const client_result = await client.compile();
	emitter.emit('build', <events.BuildEvent>{
		type: 'client',
		// TODO duration/warnings
		result: client_result
	});

	const build_info = client_result.to_json(manifest_data, dirs);

	if (opts.legacy) {
		process.env.SAPPER_LEGACY_BUILD = 'true';
		const { client } = await create_compilers(opts.bundler, dirs);

		const client_result = await client.compile();

		emitter.emit('build', <events.BuildEvent>{
			type: 'client (legacy)',
			// TODO duration/warnings
			result: client_result
		});

		client_result.to_json(manifest_data, dirs);
		build_info.legacy_assets = client_result.assets;
		delete process.env.SAPPER_LEGACY_BUILD;
	}

	fs.writeFileSync(path.join(dirs.dest, 'build.json'), JSON.stringify(build_info));

	const server_stats = await server.compile();
	emitter.emit('build', <events.BuildEvent>{
		type: 'server',
		// TODO duration/warnings
		result: server_stats
	});

	let serviceworker_stats;

	if (serviceworker) {
		create_serviceworker_manifest({
			manifest_data,
			client_files: client_result.chunks.map(chunk => `client/${chunk.file}`)
		});

		serviceworker_stats = await serviceworker.compile();

		emitter.emit('build', <events.BuildEvent>{
			type: 'serviceworker',
			// TODO duration/warnings
			result: serviceworker_stats
		});
	}
}