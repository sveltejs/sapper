const config = require('../../../webpack/config.js');
const webpack = require('webpack');

module.exports = {
	entry: './app/client.js',
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
						emitCss: !config.dev,
						cascade: false,
						store: true
					}
				}
			},
			{
				test: /\.css$/,
				use: [
					{ loader: "style-loader" },
					{ loader: "css-loader" }
				]
			}
		].filter(Boolean)
	},
	plugins: [
		config.dev && new webpack.HotModuleReplacementPlugin(),
		!config.dev && new webpack.optimize.ModuleConcatenationPlugin()
	].filter(Boolean),
	devtool: config.dev ? 'inline-source-map' : false
};