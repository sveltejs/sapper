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
				path: `${dest}/client/sapper`,
				filename: '[hash]/[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				publicPath: `sapper/`
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
				filename: '[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				libraryTarget: 'commonjs2'
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
				path: `${dest}/service-worker`,
				filename: '[name].js',
				chunkFilename: '[name].[id].[hash].js'
			}
		}
	}
};