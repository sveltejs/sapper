const fs = require('fs');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// TODO make the webpack config, err, configurable

module.exports = function create_webpack_compiler(main, dest, dev) {
	const compiler = {};

	const _ = webpack({
		entry: {
			main
		},
		resolve: {
			extensions: ['.js', '.html']
		},
		output: {
			path: dest,
			filename: '[name].[hash].js',
			chunkFilename: '[name].[id].js',
			publicPath: '/webpack/'
		},
		module: {
			rules: [
				{
					test: /\.html$/,
					exclude: /node_modules/,
					use: {
						loader: 'svelte-loader',
						options: {
							emitCss: true,
							cascade: false,
							store: true
						}
					}
				},
				{
					test: /\.css$/,
					use: ExtractTextPlugin.extract({
						fallback: 'style-loader',
						use: [{ loader: 'css-loader', options: { sourceMap: dev } }]
					})
				}
			]
		},
		plugins: [
			new ExtractTextPlugin('main.css'),
			!dev && new webpack.optimize.ModuleConcatenationPlugin(),
			!dev && new UglifyJSPlugin()
		].filter(Boolean),
		devtool: dev ? 'inline-source-map' : false
	});

	if (false) { // TODO watch in dev
		// TODO how can we invalidate compiler.app when watcher restarts?
		compiler.app = new Promise((fulfil, reject) => {
			_.watch({}, (err, stats) => {
				if (err || stats.hasErrors()) {
					// TODO handle errors
				}

				const filename = stats.toJson().assetsByChunkName.main;
				fulfil(`/webpack/${filename}`);
			});
		});
	} else {
		compiler.app = new Promise((fulfil, reject) => {
			_.run((err, stats) => {
				if (err || stats.hasErrors()) {
					// TODO handle errors
				}

				const filename = stats.toJson().assetsByChunkName.main;
				fulfil(`/webpack/${filename}`);
			});
		});
	}

	return compiler;
};