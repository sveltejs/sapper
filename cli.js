#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var core_js = require('./core.js');
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

const cmd = process.argv[2];
const start = Date.now();

if (cmd === 'build') {
	core_js.build({ dest, dev, entry, src })
		.then(() => {
			const elapsed = Date.now() - start;
			console.error(`built in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
		})
		.catch(err => {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		});
} else if (cmd === 'export') {
	const start = Date.now();

	core_js.build({ dest, dev, entry, src })
		.then(() => core_js.export({ src, dest }))
		.then(() => {
			const elapsed = Date.now() - start;
			console.error(`extracted in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
		})
		.catch(err => {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		});
}
//# sourceMappingURL=cli.js.map
