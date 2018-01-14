#!/usr/bin/env node

const build = require('../lib/build.js');

const cmd = process.argv[2];
const start = Date.now();

if (cmd === 'build') {
	build()
		.then(() => {
			const elapsed = Date.now() - start;
			console.error(`built in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
		})
		.catch(err => {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		});
} else if (cmd === 'extract') {
	const start = Date.now();

	build()
		.then(() => require('../lib/utils/extract.js')())
		.then(() => {
			const elapsed = Date.now() - start;
			console.error(`extracted in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
		})
		.catch(err => {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		});
}
