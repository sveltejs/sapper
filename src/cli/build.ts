import _build from '../api/build';
import * as colors from 'ansi-colors';
import { locations } from '../config';

export function build() {
	return new Promise((fulfil, reject) => {
		try {
			console.log('1');
			const emitter = _build({
				dest: locations.dest(),
				app: locations.app(),
				routes: locations.routes(),
				webpack: 'webpack'
			});
			console.log('2', emitter);

			emitter.on('build', event => {
				console.log(colors.inverse(`\nbuilt ${event.type}`));
				console.log(event.webpack_stats.toString({ colors: true }));
			});

			emitter.on('error', event => {
				reject(event.error);
			});

			emitter.on('done', event => {
				fulfil();
			});
		} catch (err) {
			console.log(`${colors.bold.red(`> ${err.message}`)}`);
			process.exit(1);
		}
	});
}