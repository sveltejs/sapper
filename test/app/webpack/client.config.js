const config = require('../../../config/webpack.js');
const webpack = require('webpack');

const mode = process.env.NODE_ENV;
const isDev = mode === 'development';

module.exports = {
	entry: config.client.entry(),
	output: config.client.output(),
	resolve: {
		extensions: ['.js', '.html']
	},
	module: {
		rules: [
			{
				test: /\.html$/,
				exclude: /node_modules/,
				use: {
					loader: 'svelte-loader',
					options: {
						hydratable: true,
						cascade: false,
						store: true
					}
				}
			}
		]
	},
	mode,
	plugins: [
		isDev && new webpack.HotModuleReplacementPlugin()
	].filter(Boolean),
	devtool: isDev && 'inline-source-map'
};