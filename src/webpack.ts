import { locations, dev } from './config';

export default {
	dev: dev(),

	client: {
		entry: () => {
			return {
				main: './app/client'
			};
		},

		output: () => {
			return {
				path: `${locations.dest()}/client`,
				filename: '[hash]/[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				publicPath: '/client/'
			};
		}
	},

	server: {
		entry: () => {
			return {
				server: './app/server'
			};
		},

		output: () => {
			return {
				path: locations.dest(),
				filename: '[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				libraryTarget: 'commonjs2'
			};
		}
	},

	serviceworker: {
		entry: () => {
			return {
				'service-worker': './app/service-worker'
			};
		},

		output: () => {
			return {
				path: locations.dest(),
				filename: '[name].js',
				chunkFilename: '[name].[id].[hash].js'
			}
		}
	}
};