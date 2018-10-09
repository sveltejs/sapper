import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import minify_html from './utils/minify_html';
import { create_compilers, create_main_manifests, create_manifest_data, create_serviceworker_manifest } from '../core';
import { copy_shimport } from './utils/copy_shimport';
import read_template from '../core/read_template';
import { CompileResult } from '../core/create_compilers/interfaces';
import { noop } from './utils/noop';
import validate_bundler from './utils/validate_bundler';

type Opts = {
	cwd?: string;
	src?: string;
	routes?: string;
	dest?: string;
	output?: string;
	static?: string;
	legacy?: boolean;
	bundler?: 'rollup' | 'webpack';
	oncompile?: ({ type, result }: { type: string, result: CompileResult }) => void;
};

export async function build({
	cwd,
	src = 'src',
	routes = 'src/routes',
	output = '__sapper__',
	static: static_files = 'static',
	dest = '__sapper__/build',

	bundler,
	legacy = false,
	oncompile = noop
}: Opts = {}) {
	bundler = validate_bundler(bundler);

	cwd = path.resolve(cwd);
	src = path.resolve(cwd, src);
	dest = path.resolve(cwd, dest);
	routes = path.resolve(cwd, routes);
	output = path.resolve(cwd, output);
	static_files = path.resolve(cwd, static_files);
	dest = path.resolve(cwd, dest);

	if (legacy && bundler === 'webpack') {
		throw new Error(`Legacy builds are not supported for projects using webpack`);
	}

	rimraf.sync(path.join(dest, '**/*'));
	mkdirp.sync(`${dest}/client`);
	copy_shimport(dest);

	// minify src/template.html
	// TODO compile this to a function? could be quicker than str.replace(...).replace(...).replace(...)
	const template = read_template(src);

	// remove this in a future version
	if (template.indexOf('%sapper.base%') === -1) {
		const error = new Error(`As of Sapper v0.10, your template.html file must include %sapper.base% in the <head>`);
		error.code = `missing-sapper-base`;
		throw error;
	}

	fs.writeFileSync(`${dest}/template.html`, minify_html(template));

	const manifest_data = create_manifest_data(routes);

	// create src/manifest/client.js and src/manifest/server.js
	create_main_manifests({
		bundler,
		manifest_data,
		cwd,
		src,
		dest,
		routes,
		output,
		dev: false
	});

	const { client, server, serviceworker } = await create_compilers(bundler, cwd, src, dest, true);

	const client_result = await client.compile();
	oncompile({
		type: 'client',
		result: client_result
	});

	const build_info = client_result.to_json(manifest_data, { src, routes, dest });

	if (legacy) {
		process.env.SAPPER_LEGACY_BUILD = 'true';
		const { client } = await create_compilers(bundler, cwd, src, dest, true);

		const client_result = await client.compile();

		oncompile({
			type: 'client (legacy)',
			result: client_result
		});

		client_result.to_json(manifest_data, { src, routes, dest });
		build_info.legacy_assets = client_result.assets;
		delete process.env.SAPPER_LEGACY_BUILD;
	}

	fs.writeFileSync(path.join(dest, 'build.json'), JSON.stringify(build_info));

	const server_stats = await server.compile();
	oncompile({
		type: 'server',
		result: server_stats
	});

	let serviceworker_stats;

	if (serviceworker) {
		create_serviceworker_manifest({
			manifest_data,
			output,
			client_files: client_result.chunks.map(chunk => `client/${chunk.file}`),
			static_files
		});

		serviceworker_stats = await serviceworker.compile();

		oncompile({
			type: 'serviceworker',
			result: serviceworker_stats
		});
	}
}