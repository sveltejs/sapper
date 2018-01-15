const glob = require('glob');
const create_routes = require('./utils/create_routes.js');
const { src, dev } = require('./config.js');

const callbacks = [];

exports.onchange = fn => {
	callbacks.push(fn);
};

function update() {
	exports.routes = create_routes(
		glob.sync('**/*.+(html|js|mjs)', { cwd: src })
	);

	callbacks.forEach(fn => fn());
}

update();

if (dev) {
	const watcher = require('chokidar').watch(`${src}/**/*.+(html|js|mjs)`, {
		ignoreInitial: true,
		persistent: false
	});

	watcher.on('add', update);
	watcher.on('change', update);
	watcher.on('unlink', update);
}
