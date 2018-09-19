import { build as _build } from '../api/build';
import colors from 'kleur';
import { locations } from '../config';
import validate_bundler from './utils/validate_bundler';
import { repeat } from '../utils';

export function build(opts: { bundler?: string, legacy?: boolean }) {
	const bundler = validate_bundler(opts.bundler);

	if (opts.legacy && bundler === 'webpack') {
		throw new Error(`Legacy builds are not supported for projects using webpack`);
	}

	return new Promise((fulfil, reject) => {
		try {
			const emitter = _build({
				legacy: opts.legacy,
				bundler
			}, {
				dest: locations.dest(),
				src: locations.src(),
				routes: locations.routes(),
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