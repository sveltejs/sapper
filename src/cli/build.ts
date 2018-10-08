import { build as _build } from '../api/build';
import colors from 'kleur';
import { locations } from '../config';
import { repeat } from '../utils';

export function build(opts: { bundler?: 'rollup' | 'webpack', legacy?: boolean }) {
	return _build({
		legacy: opts.legacy,
		bundler: opts.bundler,
		oncompile: event => {
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
		},
		dest: locations.dest(),
		src: locations.src(),
		routes: locations.routes()
	});
}