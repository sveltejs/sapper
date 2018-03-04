import { dest, dev } from '../config';

export default {
	dev: dev(),

	client: {
		entry: () => {
			return {
				main: './app/client.js'
			};
		},

		output: () => {
			return {
				path: `${dest()}/client`,
				filename: '[hash]/[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				publicPath: '/client/'
			};
		}
	},

	server: {
		entry: () => {
			return {
				server: './app/server.js'
			};
		},

		output: () => {
			return {
				path: dest(),
				filename: '[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				libraryTarget: 'commonjs2'
			};
		}
	},

	serviceworker: {
		entry: () => {
			return {
				'service-worker': './app/service-worker.js'
			};
		},

		output: () => {
			return {
				path: dest(),
				filename: '[name].js',
				chunkFilename: '[name].[id].[hash].js'
			}
		}
	}
};