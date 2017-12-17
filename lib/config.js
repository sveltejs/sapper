const path = require('path');

exports.dev = process.env.NODE_ENV !== 'production';

exports.templates = path.resolve(process.env.SAPPER_TEMPLATES || 'templates');

exports.src = path.resolve(process.env.SAPPER_ROUTES || 'routes');

exports.dest = path.resolve(
	process.env.NOW ? '/tmp' :
	process.env.SAPPER_DEST || '.sapper'
);

exports.server_routes = path.resolve(exports.dest, 'server-routes.js');