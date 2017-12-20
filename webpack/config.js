const path = require('path');
const { src, dest, dev, server_routes } = require('../lib/config.js');

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