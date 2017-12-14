const path = require('path');
const route_manager = require('../lib/route_manager.js');
const { src, dest, dev } = require('../lib/config.js');

module.exports = {
	dev,

	client: {
		entry: () => {
			return {
				main: `${dest}/main.js`
			};
		},

		output: () => {
			return {
				path: `${dest}/client`,
				filename: '[name].[hash].js',
				chunkFilename: '[name].[id].js',
				publicPath: '/client/'
			};
		}
	},

	server: {
		entry: () => {
			const entries = {};
			route_manager.routes.forEach(route => {
				entries[route.id] = path.resolve(src, route.file);
			});
			return entries;
		},

		output: () => {
			return {
				path: `${dest}/server`,
				filename: '[name].[hash].js',
				chunkFilename: '[name].[id].js',
				libraryTarget: 'commonjs2'
			};
		}
	}
};