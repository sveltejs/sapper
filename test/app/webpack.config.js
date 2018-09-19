const webpack = require('webpack');
const config = require('../../config/webpack.js');
const sapper_pkg = require('../../package.json');

const mode = process.env.NODE_ENV;
const isDev = mode === 'development';

module.exports = {
	client: {
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
	},

	server: {
		entry: config.server.entry(),
		output: config.server.output(),
		target: 'node',
		resolve: {
			extensions: ['.js', '.html']
		},
		externals: [].concat(
			Object.keys(sapper_pkg.dependencies),
			Object.keys(sapper_pkg.devDependencies)
		),
		module: {
			rules: [
				{
					test: /\.html$/,
					exclude: /node_modules/,
					use: {
						loader: 'svelte-loader',
						options: {
							css: false,
							cascade: false,
							store: true,
							generate: 'ssr'
						}
					}
				}
			]
		},
		mode,
		performance: {
			hints: false // it doesn't matter if server.js is large
		}
	},

	serviceworker: {
		entry: config.serviceworker.entry(),
		output: config.serviceworker.output(),
		mode
	}
};