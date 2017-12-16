const path = require('path');
const route_manager = require('../lib/route_manager.js');
const { src, dest, dev, main_built, server_routes } = require('../lib/config.js');

module.exports = {
	dev,

	client: {
		entry: () => {
			return {
				main: main_built
			};
		},

		output: () => {
			return {
				path: `${dest}/client`,
				filename: '[name].[hash].js',
				chunkFilename: '[name].[id].[hash].js',
				publicPath: '/client/'
			};
		}
	},

	server: {
		entry: () => {
			return {
				server_routes
			}
		},

		output: () => {
			return {
				path: `${dest}/server`,
				filename: '[name].[hash].js',
				chunkFilename: '[name].[id].[hash].js',
				libraryTarget: 'commonjs2'
			};
		}
	}
};