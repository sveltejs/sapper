import { build as _build } from '../api/build';
import colors from 'kleur';
import { locations } from '../config';
import validate_bundler from './utils/validate_bundler';
import { repeat } from '../utils';

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
				let banner = `built ${event.type}`;
				let c = colors.cyan;

				const { warnings } = event.result;
				if (warnings.length > 0) {
					banner += ` with ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}`;
					c = colors.yellow;
				}

				console.log();
				console.log(c(`┌─${repeat('─', banner.length)}─┐`));
				console.log(c(`│ ${colors.bold(banner)       } │`));
				console.log(c(`└─${repeat('─', banner.length)}─┘`));

				console.log(event.result.print());
			});

			emitter.on('error', event => {
				reject(event.error);
			});

			emitter.on('done', event => {
				fulfil();
			});
		} catch (err) {
			reject(err);
		}
	});
}