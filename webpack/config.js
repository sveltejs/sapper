'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = require('path');
var mkdirp = _interopDefault(require('mkdirp'));
var rimraf = _interopDefault(require('rimraf'));

const dev = process.env.NODE_ENV !== 'production';

const templates = path.resolve(process.env.SAPPER_TEMPLATES || 'templates');

const src = path.resolve(process.env.SAPPER_ROUTES || 'routes');

const dest = path.resolve(process.env.SAPPER_DEST || '.sapper');

if (dev) {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));
}

const entry = {
	client: path.resolve(templates, '.main.rendered.js'),
	server: path.resolve(dest, 'server-entry.js')
};

var index = {
	dev,

	client: {
		entry: () => {
			return {
				main: [
					entry.client,
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
				main: entry.server
			};
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

module.exports = index;
