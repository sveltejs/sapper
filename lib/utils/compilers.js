const path = require('path');
const relative = require('require-relative');
const webpack = relative('webpack', process.cwd());

exports.client = webpack(
	require(path.resolve('webpack.client.config.js'))
);

exports.server = webpack(
	require(path.resolve('webpack.server.config.js'))
);