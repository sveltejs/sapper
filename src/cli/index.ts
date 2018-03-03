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

if (cmd === 'build') {
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
} else if (cmd === 'export') {
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
} else if (cmd === 'dev') {
	dev();
} else if (cmd === 'upgrade') {
	upgrade();
} else {
	console.log(`unrecognized command ${cmd} — try \`sapper --help\` for more information`);
}
