import * as fs from 'fs';
import { Dirs } from '../../interfaces';
import RollupCompiler from './RollupCompiler';
import { WebpackCompiler } from './WebpackCompiler';

export type Compiler = RollupCompiler | WebpackCompiler;

export type Compilers = {
	client: Compiler;
	server: Compiler;
	serviceworker?: Compiler;
}

export default function create_compilers(bundler: string, dirs: Dirs): Compilers {
	if (bundler === 'rollup') {
		const sw = `${dirs.rollup}/service-worker.config.js`;

		return {
			client: new RollupCompiler(`${dirs.rollup}/client.config.js`),
			server: new RollupCompiler(`${dirs.rollup}/server.config.js`),
			serviceworker: fs.existsSync(sw) && new RollupCompiler(sw)
		};
	}

	if (bundler === 'webpack') {
		const sw = `${dirs.webpack}/service-worker.config.js`;

		return {
			client: new WebpackCompiler(`${dirs.webpack}/client.config.js`),
			server: new WebpackCompiler(`${dirs.webpack}/server.config.js`),
			serviceworker: fs.existsSync(sw) && new WebpackCompiler(sw)
		};
	}

	// this shouldn't be possible...
	throw new Error(`Invalid bundler option '${bundler}'`);
}