import glob from 'glob';
import create_routes from './utils/create_routes.js';
import { src, dev } from '../config.js';

const callbacks = [];

export function onchange(fn) {
	callbacks.push(fn);
}

export let routes;

function update() {
	routes = create_routes(
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
