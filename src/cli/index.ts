import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import sade from 'sade';
import chalk from 'chalk';
import prettyMs from 'pretty-ms';
import help from './help.md';
import build from './build';
import exporter from './export';
import dev from './dev';
import upgrade from './upgrade';
import * as ports from 'port-authority';
import * as pkg from '../../package.json';

const prog = sade('sapper').version(pkg.version);

prog.command('dev')
	.describe('Start a development server')
	.option('-p, --port', 'Specify a port')
	.action(async (opts: { port: number }) => {
		let port = opts.port || +process.env.PORT;

		if (port) {
			if (!await ports.check(port)) {
				console.log(chalk.bold.red(`> Port ${port} is unavailable`));
				return;
			}
		} else {
			port = await ports.find(3000);
		}

		dev(port);
	});

prog.command('build [dest]')
	.describe('Create a production-ready version of your app')
	.action((dest = 'build') => {
		console.log(`> Building...`);

		process.env.NODE_ENV = 'production';
		process.env.SAPPER_DEST = dest;

		const start = Date.now();

		build()
			.then(() => {
				const elapsed = Date.now() - start;
				console.error(`\n> Finished in ${prettyMs(elapsed)}. Type ${chalk.bold.cyan(dest === 'build' ? 'npx sapper start' : `npx sapper start ${dest}`)} to run the app.`);
			})
			.catch(err => {
				console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
			});
	});

prog.command('start [dir]')
	.describe('Start your app')
	.option('-p, --port', 'Specify a port')
	.action(async (dir = 'build', opts: { port: number }) => {
		let port = opts.port || +process.env.PORT;

		const resolved = path.resolve(dir);
		const server = path.resolve(dir, 'server.js');

		if (!fs.existsSync(server)) {
			console.log(chalk.bold.red(`> ${dir}/server.js does not exist — type ${chalk.bold.cyan(dir === 'build' ? `npx sapper build` : `npx sapper build ${dir}`)} to create it`));
			return;
		}

		if (port) {
			if (!await ports.check(port)) {
				console.log(chalk.bold.red(`> Port ${port} is unavailable`));
				return;
			}
		} else {
			port = await ports.find(3000);
		}

		child_process.fork(server, [], {
			cwd: process.cwd(),
			env: Object.assign({
				NODE_ENV: 'production',
				PORT: port,
				SAPPER_DEST: dir
			}, process.env)
		});
	});

prog.command('export [dest]')
	.describe('Export your app as static files (if possible)')
	.action((dest = 'export') => {
		console.log(`> Building...`);

		process.env.NODE_ENV = 'production';
		process.env.SAPPER_DEST = '.sapper/.export';

		const start = Date.now();

		build()
			.then(() => {
				const elapsed = Date.now() - start;
				console.error(`\n> Built in ${prettyMs(elapsed)}. Exporting...`);
			})
			.then(() => exporter(dest))
			.then(() => {
				const elapsed = Date.now() - start;
				console.error(`\n> Finished in ${prettyMs(elapsed)}. Type ${chalk.bold.cyan(`npx serve ${dest}`)} to run the app.`);
			})
			.catch(err => {
				console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
			});
	});

// TODO upgrade

prog.parse(process.argv);