import { basepath, locations, dev } from './config';

const base = basepath() ? `/${basepath()}` : '';

export default {
	dev: dev(),

	client: {
		entry: () => {
			return {
				main: `${locations.app()}/client`
			};
		},

		output: () => {
			return {
				path: `${locations.dest()}/client`,
				filename: '[hash]/[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				publicPath: `${base}/client/`
			};
		}
	},

	server: {
		entry: () => {
			return {
				server: `${locations.app()}/server`
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
				'service-worker': `${locations.app()}/service-worker`
			};
		},

		output: () => {
			return {
				path: locations.dest(),
				filename: '[name].js',
				chunkFilename: '[name].[id].[hash].js',
				publicPath: base
			}
		}
	}
};