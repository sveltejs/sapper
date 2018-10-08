import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import minify_html from './utils/minify_html';
import { create_compilers, create_main_manifests, create_manifest_data, create_serviceworker_manifest } from '../core';
import { copy_shimport } from './utils/copy_shimport';
import { Dirs } from '../interfaces';
import read_template from '../core/read_template';
import { CompileResult } from '../core/create_compilers/interfaces';
import { noop } from './utils/noop';

type Opts = {
	legacy: boolean;
	bundler: 'rollup' | 'webpack';
	oncompile: ({ type, result }: { type: string, result: CompileResult }) => void;
};

export async function build(opts: Opts, dirs: Dirs) {
	const { oncompile = noop } = opts;

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

	const { client, server, serviceworker } = await create_compilers(opts.bundler);

	const client_result = await client.compile();
	oncompile({
		type: 'client',
		result: client_result
	});

	const build_info = client_result.to_json(manifest_data, dirs);

	if (opts.legacy) {
		process.env.SAPPER_LEGACY_BUILD = 'true';
		const { client } = await create_compilers(opts.bundler);

		const client_result = await client.compile();

		oncompile({
			type: 'client (legacy)',
			result: client_result
		});

		client_result.to_json(manifest_data, dirs);
		build_info.legacy_assets = client_result.assets;
		delete process.env.SAPPER_LEGACY_BUILD;
	}

	fs.writeFileSync(path.join(dirs.dest, 'build.json'), JSON.stringify(build_info));

	const server_stats = await server.compile();
	oncompile({
		type: 'server',
		result: server_stats
	});

	let serviceworker_stats;

	if (serviceworker) {
		create_serviceworker_manifest({
			manifest_data,
			client_files: client_result.chunks.map(chunk => `client/${chunk.file}`)
		});

		serviceworker_stats = await serviceworker.compile();

		oncompile({
			type: 'serviceworker',
			result: serviceworker_stats
		});
	}
}