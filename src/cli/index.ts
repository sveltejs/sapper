import { build, export as exporter } from 'sapper/core.js';
import { dest, dev, entry, src } from '../config';

process.env.NODE_ENV = 'production';

const cmd = process.argv[2];
const start = Date.now();

if (cmd === 'build') {
	build({ dest, dev, entry, src })
		.then(() => {
			const elapsed = Date.now() - start;
			console.error(`built in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
		})
		.catch(err => {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		});
} else if (cmd === 'export') {
	build({ dest, dev: false, entry, src })
		.then(() => exporter({ src, dest }))
		.then(() => {
			const elapsed = Date.now() - start;
			console.error(`extracted in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
		})
		.catch(err => {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		});
}
