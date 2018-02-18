const path = require('path');
const config = require('../../../webpack/config.js');
const webpack = require('webpack');

module.exports = {
	entry: {
		'service-worker': './app/service-worker.js'
	},
	output: {
		path: path.resolve(`.sapper`),
		filename: '[name].js',
		chunkFilename: '[name].[id].[hash].js'
	},
	plugins: [
		!config.dev && new webpack.optimize.ModuleConcatenationPlugin()
	].filter(Boolean)
};