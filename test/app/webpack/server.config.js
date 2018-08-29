const config = require('../../../config/webpack.js');
const sapper_pkg = require('../../../package.json');

module.exports = {
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
	mode: process.env.NODE_ENV,
	performance: {
		hints: false // it doesn't matter if server.js is large
	}
};