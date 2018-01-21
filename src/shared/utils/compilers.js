import * as path from 'path';
import relative from 'require-relative';

const webpack = relative('webpack', process.cwd());

export const client = webpack(
	require(path.resolve('webpack.client.config.js'))
);

export const server = webpack(
	require(path.resolve('webpack.server.config.js'))
);