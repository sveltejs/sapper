import { dest, isDev, entry } from '../config';

export default {
	dev: isDev(),

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
				server: './app/server.js'
			};
		},

		output: () => {
			return {
				path: `${dest}`,
				filename: '[name].js',
				chunkFilename: '[name].[id].[hash].js',
				libraryTarget: 'commonjs2'
			};
		}
	}
};
