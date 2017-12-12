const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// TODO make the webpack config, err, configurable

module.exports = function create_webpack_compiler(out, routes, dev) {
	const compiler = {};

	const client = webpack({
		entry: {
			main: `${out}/main`
		},
		resolve: {
			extensions: ['.js', '.html']
		},
		output: {
			path: `${out}/client`,
			filename: '[name].[hash].js',
			chunkFilename: '[name].[id].js',
			publicPath: '/client/'
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

	const server_entries = {};
	routes.forEach(route => {
		server_entries[route.id] = path.resolve('routes', route.file);
	});

	const server = webpack({
		entry: server_entries,
		target: 'node',
		resolve: {
			extensions: ['.js', '.html']
		},
		output: {
			path: `${out}/server`,
			filename: '[name].[hash].js',
			chunkFilename: '[name].[id].js',
			libraryTarget: 'commonjs2'
		},
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
		}
	});

	if (false) { // TODO watch in dev
		// TODO how can we invalidate compiler.client_main when watcher restarts?
		compiler.client_main = new Promise((fulfil, reject) => {
			client.watch({}, (err, stats) => {
				if (err || stats.hasErrors()) {
					// TODO handle errors
				}

				const filename = stats.toJson().assetsByChunkName.main;
				fulfil(`/client/${filename}`);
			});
		});

		// TODO server
	} else {
		compiler.client_main = new Promise((fulfil, reject) => {
			client.run((err, stats) => {
				if (err || stats.hasErrors()) {
					console.log(stats.toString());
					reject(err);
				}

				const filename = stats.toJson().assetsByChunkName.main;
				fulfil(`/client/${filename}`);
			});
		});

		const chunks = new Promise((fulfil, reject) => {
			server.run((err, stats) => {
				if (err || stats.hasErrors()) {
					// TODO deal with hasErrors
					console.log(stats.toString());
					reject(err);
				}

				fulfil(stats.toJson().assetsByChunkName);
			});
		});

		compiler.get_chunk = async id => {
			const assetsByChunkName = await chunks;
			return path.resolve(out, 'server', assetsByChunkName[id]);
		};
	}

	return compiler;
};