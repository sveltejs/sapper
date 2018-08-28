import { build as _build } from '../api/build';
import colors from 'kleur';
import { locations } from '../config';
import validate_bundler from './utils/validate_bundler';

export function build(opts: { bundler?: string }) {
	const bundler = validate_bundler(opts.bundler);

	return new Promise((fulfil, reject) => {
		try {
			const emitter = _build({
				dest: locations.dest(),
				app: locations.app(),
				routes: locations.routes(),
				bundler,
				webpack: 'webpack',
				rollup: 'rollup'
			});

			emitter.on('build', event => {
				console.log(colors.inverse(`\nbuilt ${event.type}`));
				console.log(event.result.print());
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