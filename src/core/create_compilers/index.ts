import * as fs from 'fs';
import * as path from 'path';
import RollupCompiler from './RollupCompiler';
import { WebpackCompiler } from './WebpackCompiler';
import { set_dev, set_src, set_dest, set_module } from '../../config/env';

export type Compiler = RollupCompiler | WebpackCompiler;

export type Compilers = {
	client: Compiler;
	server: Compiler;
	serviceworker?: Compiler;
}

export default async function create_compilers(
	bundler: 'rollup' | 'webpack',
	cwd: string,
	src: string,
	routes: string,
	dest: string,
	dev: boolean
): Promise<Compilers> {
	set_dev(dev);
	set_src(src);
	set_dest(dest);
	try {
		set_module(JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf-8')).type === 'module');
	} catch (err) {
		set_module(false);
	}

	if (bundler === 'rollup') {
		const config = await RollupCompiler.load_config(cwd);
		validate_config(config, 'rollup');

		normalize_rollup_config(config.client);
		normalize_rollup_config(config.server);

		if (config.serviceworker) {
			normalize_rollup_config(config.serviceworker);
		}

		return {
			client: new RollupCompiler(config.client, routes),
			server: new RollupCompiler(config.server, routes),
			serviceworker: config.serviceworker && new RollupCompiler(config.serviceworker, routes)
		};
	}

	if (bundler === 'webpack') {
		const config = require(path.resolve(cwd, 'webpack.config.js')); // eslint-disable-line
		validate_config(config, 'webpack');

		return {
			client: new WebpackCompiler(config.client),
			server: new WebpackCompiler(config.server),
			serviceworker: config.serviceworker && new WebpackCompiler(config.serviceworker)
		};
	}

	// this shouldn't be possible...
	throw new Error(`Invalid bundler option '${bundler}'`);
}

function validate_config(config: any, bundler: 'rollup' | 'webpack') {
	if (!config.client || !config.server) {
		throw new Error(`${bundler}.config.js must export a { client, server, serviceworker? } object`);
	}
}

function normalize_rollup_config(config: any) {
	if (typeof config.input === 'string') {
		config.input = path.normalize(config.input);
	} else {
		for (const name in config.input) {
			config.input[name] = path.normalize(config.input[name]);
		}
	}
}
