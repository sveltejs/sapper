import { locations, dev } from './config';

export default {
	dev: dev(),

	client: {
		entry: () => {
			return {
				main: `${locations.src()}/client`
			};
		},

		output: () => {
			return {
				path: `${locations.dest()}/client`,
				filename: '[hash]/[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				publicPath: `client/`
			};
		}
	},

	server: {
		entry: () => {
			return {
				server: `${locations.src()}/server`
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
				'service-worker': `${locations.src()}/service-worker`
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