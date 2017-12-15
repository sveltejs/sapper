const glob = require('glob');
const create_routes = require('./utils/create_routes.js');
const { src } = require('./config.js');

const route_manager = {
	routes: create_routes(
		glob.sync('**/*.+(html|js|mjs)', { cwd: src })
	),

	onchange(fn) {
		// TODO in dev mode, keep this updated, and allow
		// webpack compiler etc to hook into it
	}
};

module.exports = route_manager;