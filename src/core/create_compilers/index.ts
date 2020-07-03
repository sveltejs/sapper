import * as path from 'path';
import RollupCompiler from './RollupCompiler';
import { WebpackCompiler } from './WebpackCompiler';
import { set_dev, set_src, set_dest } from '../../config/env';

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
	dest: string,
	dev: boolean
): Promise<Compilers> {
	set_dev(dev);
	set_src(src);
	set_dest(dest);

	if (bundler === 'rollup') {
		const config = await RollupCompiler.load_config(cwd);
		validate_config(config, 'rollup');

		const client = get_config(config, 'client');
		const server = get_config(config, 'server');
		const serviceworker = get_config(config, 'serviceworker');

		normalize_rollup_config(client);
		normalize_rollup_config(server);

		if (serviceworker) {
			normalize_rollup_config(serviceworker);
		}

		return {
			client: new RollupCompiler(client),
			server: new RollupCompiler(server),
			serviceworker: serviceworker && new RollupCompiler(serviceworker)
		};
	}

	if (bundler === 'webpack') {
		const config = require(path.resolve(cwd, 'webpack.config.js'));
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

function validate_config(config, bundler: 'rollup' | 'webpack') {
	if (!get_config(config, 'client') || !get_config(config, 'server')) {
		throw new Error(`${bundler}.config.js must export client and server configuration`);
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

function get_config(config: object, name: string) {
	const filename = name === 'serviceworker' ? `service-worker` : `${name}`;
	return config[name] || config.find(bundle =>
		bundle.input.endsWith(`/${filename}.js`) || bundle.input.endsWith(`/${filename}.ts`));
}
