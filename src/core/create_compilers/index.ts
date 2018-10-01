import * as path from 'path';
import RollupCompiler from './RollupCompiler';
import { WebpackCompiler } from './WebpackCompiler';

export type Compiler = RollupCompiler | WebpackCompiler;

export type Compilers = {
	client: Compiler;
	server: Compiler;
	serviceworker?: Compiler;
}

export default async function create_compilers(bundler: 'rollup' | 'webpack'): Promise<Compilers> {
	if (bundler === 'rollup') {
		const config = await RollupCompiler.load_config();
		validate_config(config, 'rollup');

		normalize_rollup_config(config.client);
		normalize_rollup_config(config.server);

		if (config.serviceworker) {
			normalize_rollup_config(config.serviceworker);
		}

		return {
			client: new RollupCompiler(config.client),
			server: new RollupCompiler(config.server),
			serviceworker: config.serviceworker && new RollupCompiler(config.serviceworker)
		};
	}

	if (bundler === 'webpack') {
		const config = require(path.resolve('webpack.config.js'));
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
