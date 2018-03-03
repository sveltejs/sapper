import { dest, dev } from '../config';

export default {
	dev: dev(),

	client: {
		entry: () => {
			return {
				main: [
					'./app/client.js',
					// workaround for https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/456
					'style-loader/lib/addStyles',
					'css-loader/lib/css-base'
				]
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
				path: `${dest()}`,
				filename: '[name].js',
				chunkFilename: '[hash]/[name].[id].js',
				libraryTarget: 'commonjs2'
			};
		}
	}
};
