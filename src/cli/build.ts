import * as path from 'path';
import { build as _build } from '../api/build';
import colors from 'kleur';
import { repeat } from '../utils';

export function build(opts: { bundler?: 'rollup' | 'webpack', legacy?: boolean, dest: string }) {
	const cwd = path.resolve(process.env.SAPPER_BASE || '');

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
		cwd,
		src:    path.resolve(cwd, process.env.SAPPER_SRC    || 'src'),
		routes: path.resolve(cwd, process.env.SAPPER_ROUTES || 'src/routes'),
		dest:   path.resolve(cwd, opts.dest)
	});
}