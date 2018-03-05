import * as path from 'path';
import * as child_process from 'child_process';
import mri from 'mri';
import chalk from 'chalk';
import help from './help.md';
import build from './build';
import exporter from './export';
import dev from './dev';
import upgrade from './upgrade';
import * as pkg from '../../package.json';

const opts = mri(process.argv.slice(2), {
	alias: {
		h: 'help'
	}
});

if (opts.help) {
	const rendered = help
		.replace('<@version@>', pkg.version)
		.replace(/^(.+)/gm, (m: string, $1: string) => /[#>]/.test(m) ? $1 : `  ${$1}`)
		.replace(/^# (.+)/gm, (m: string, $1: string) => chalk.bold.underline($1))
		.replace(/^> (.+)/gm, (m: string, $1: string) => chalk.cyan($1));

	console.log(`\n${rendered}\n`);
	process.exit(0);
}

const [cmd] = opts._;

const start = Date.now();

switch (cmd) {
	case 'build':
		process.env.NODE_ENV = 'production';
		process.env.SAPPER_DEST = opts._[1] || 'build';

		build()
			.then(() => {
				const elapsed = Date.now() - start;
				console.error(`built in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
			})
			.catch(err => {
				console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
			});

		break;

	case 'export':
		process.env.NODE_ENV = 'production';

		const export_dir = opts._[1] || 'export';

		build()
			.then(() => exporter(export_dir))
			.then(() => {
				const elapsed = Date.now() - start;
				console.error(`extracted in ${elapsed}ms`); // TODO beautify this, e.g. 'built in 4.7 seconds'
			})
			.catch(err => {
				console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
			});

		break;

	case 'dev':
		dev();
		break;

	case 'upgrade':
		upgrade();
		break;

	case 'start':
		const dir = path.resolve(opts._[1] || 'build');

		child_process.fork(`${dir}/server.js`, [], {
			cwd: process.cwd(),
			env: Object.assign({
				NODE_ENV: 'production',
				SAPPER_DEST: dir
			}, process.env)
		});

		break;

	default:
		console.log(`unrecognized command ${cmd} — try \`sapper --help\` for more information`);
}