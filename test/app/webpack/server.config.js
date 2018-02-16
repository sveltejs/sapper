const config = require('../../../webpack/config.js');
const pkg = require('../package.json');
const sapper_pkg = require('../../../package.json');

module.exports = {
	entry: {
		'server': './app/server.js'
	},
	output: config.server.output(),
	target: 'node',
	resolve: {
		extensions: ['.js', '.html']
	},
	externals: Object.keys(pkg.dependencies).concat(Object.keys(sapper_pkg.dependencies)),
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
};