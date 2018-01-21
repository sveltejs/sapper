import * as path from 'path';
import relative from 'require-relative';

const webpack = relative('webpack', process.cwd());

export let client;
export let server;

export function get_compilers() {
	return {
		client: webpack(
			require(path.resolve('webpack.client.config.js'))
		),

		server: webpack(
			require(path.resolve('webpack.server.config.js'))
		)
	};
}

// export const client = webpack(
// 	require(path.resolve('webpack.client.config.js'))
// );

// export const server = webpack(
// 	require(path.resolve('webpack.server.config.js'))
// );