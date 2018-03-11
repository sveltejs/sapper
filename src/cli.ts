import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import sade from 'sade';
import * as clorox from 'clorox';
import prettyMs from 'pretty-ms';
// import upgrade from './cli/upgrade';
import * as ports from 'port-authority';
import * as pkg from '../package.json';

const prog = sade('sapper').version(pkg.version);

prog.command('dev')
	.describe('Start a development server')
	.option('-p, --port', 'Specify a port')
	.action(async (opts: { port: number }) => {
		const { dev } = await import('./cli/dev');
		dev(opts);
	});

prog.command('build [dest]')
	.describe('Create a production-ready version of your app')
	.action(async (dest = 'build') => {
		console.log(`> Building...`);

		process.env.NODE_ENV = 'production';
		process.env.SAPPER_DEST = dest;

		const start = Date.now();

		try {
			const { build } = await import('./cli/build');
			await build();
			console.error(`\n> Finished in ${elapsed(start)}. Type ${clorox.bold.cyan(dest === 'build' ? 'npx sapper start' : `npx sapper start ${dest}`)} to run the app.`);
		} catch (err) {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		}
	});

prog.command('start [dir]')
	.describe('Start your app')
	.option('-p, --port', 'Specify a port')
	.action(async (dir = 'build', opts: { port: number }) => {
		const { start } = await import('./cli/start');
		start(dir, opts);
	});

prog.command('export [dest]')
	.describe('Export your app as static files (if possible)')
	.action(async (dest = 'export') => {
		console.log(`> Building...`);

		process.env.NODE_ENV = 'production';
		process.env.SAPPER_DEST = '.sapper/.export';

		const start = Date.now();

		try {
			const { build } = await import('./cli/build');
			await build();
			console.error(`\n> Built in ${elapsed(start)}. Crawling site...`);

			const { exporter } = await import('./cli/export');
			await exporter(dest);
			console.error(`\n> Finished in ${elapsed(start)}. Type ${clorox.bold.cyan(`npx serve ${dest}`)} to run the app.`);
		} catch (err) {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
		}
	});

// TODO upgrade

prog.parse(process.argv);

function elapsed(start: number) {
	return prettyMs(Date.now() - start);
}