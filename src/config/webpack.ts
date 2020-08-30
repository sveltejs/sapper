import { dev, src, dest } from './env';

export default {
	dev,

	client: {
		entry: () => {
			return {
				main: `${src}/client`
			};
		},

		output: () => {
			return {
				path: `${dest}/client`,
				filename: '[hash]/[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				publicPath: `client/`
			};
		}
	},

	server: {
		entry: () => {
			return {
				server: `${src}/server`
			};
		},

		output: () => {
			return {
				path: `${dest}/server`,
				filename: '[name].mjs',
				chunkFilename: '[hash]/[name].[id].mjs',
				publicPath: `client/`,
				module: true
			};
		}
	},

	serviceworker: {
		entry: () => {
			return {
				'service-worker': `${src}/service-worker`
			};
		},

		output: () => {
			return {
				path: dest,
				filename: '[name].js',
				chunkFilename: '[name].[id].[hash].js'
			};
		}
	}
};
