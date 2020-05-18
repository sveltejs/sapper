const webpack = require('webpack');
const config = require('../../../../config/webpack.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

module.exports = {
	client: {
		entry: config.client.entry(),
		output: {
			...config.client.output(),
			publicPath: 'https://127.0.0.1:9999/foo/bar/client/'
		},
		resolve: {
			extensions: ['.mjs', '.js', '.json', '.html', '.svelte'],
			mainFields: ['svelte', 'module', 'browser', 'main']
		},
		module: {
			rules: [
				{
					test: /\.(html|svelte)$/,
					use: {
						loader: 'svelte-loader',
						options: {
							dev,
							emitCss: true,
							hydratable: true,
							hotReload: false
						}
					}
				},
				{
					test: /\.css$/,
					use: [
						/**
						 * MiniCssExtractPlugin doesn't support HMR.
						 * For developing, use 'style-loader' instead.
						 * */
						!dev ? MiniCssExtractPlugin.loader : 'style-loader',
						'css-loader'
					]
				}
			]
		},
		mode,
		plugins: [
			new MiniCssExtractPlugin({
				filename: '[name].[id].css'
			}),
			new webpack.DefinePlugin({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
		].filter(Boolean),
		devtool: dev && 'inline-source-map'
	},

	server: {
		entry: config.server.entry(),
		output: config.server.output(),
		target: 'node',
		resolve: {
			extensions: ['.mjs', '.js', '.json', '.html', '.svelte'],
			mainFields: ['svelte', 'module', 'browser', 'main']
		},
		module: {
			rules: [
				{
					test: /\.(html|svelte)$/,
					use: {
						loader: 'svelte-loader',
						options: {
							css: false,
							generate: 'ssr',
							dev
						}
					}
				}
			]
		},
		mode: process.env.NODE_ENV
	}
};
