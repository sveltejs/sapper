const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

exports.dev = process.env.NODE_ENV !== 'production';

exports.templates = path.resolve(process.env.SAPPER_TEMPLATES || 'templates');

exports.src = path.resolve(process.env.SAPPER_ROUTES || 'routes');

exports.dest = path.resolve(process.env.SAPPER_DEST || '.sapper');

if (exports.dev) {
	mkdirp.sync(exports.dest);
	rimraf.sync(path.join(exports.dest, '**/*'));
}

exports.entry = {
	client: path.resolve(exports.templates, '.main.rendered.js'),
	server: path.resolve(exports.dest, 'server-entry.js')
};