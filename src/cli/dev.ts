import * as path from 'path';
import colors from 'kleur';
import * as child_process from 'child_process';
import prettyMs from 'pretty-ms';
import { dev as _dev } from '../api/dev';
import * as events from '../api/interfaces';

export function dev(opts: { port: number, open: boolean }) {
	try {
		const watcher = _dev(opts);

		let first = true;

		watcher.on('ready', (event: events.ReadyEvent) => {
			if (first) {
				console.log(colors.bold.cyan(`> Listening on http://localhost:${event.port}`));
				if (opts.open) child_process.exec(`open http://localhost:${event.port}`);
				first = false;
			}

			// TODO clear screen?

			event.process.stdout.on('data', data => {
				process.stdout.write(data);
			});

			event.process.stderr.on('data', data => {
				process.stderr.write(data);
			});
		});

		watcher.on('invalid', (event: events.InvalidEvent) => {
			const changed = event.changed.map(filename => path.relative(process.cwd(), filename)).join(', ');
			console.log(`\n${colors.bold.cyan(changed)} changed. rebuilding...`);
		});

		watcher.on('error', (event: events.ErrorEvent) => {
			console.log(colors.red(`✗ ${event.type}`));
			console.log(colors.red(event.message));
		});

		watcher.on('fatal', (event: events.FatalEvent) => {
			console.log(colors.bold.red(`> ${event.message}`));
			if (event.log) console.log(event.log);
		});

		watcher.on('build', (event: events.BuildEvent) => {
			if (event.errors.length) {
				console.log(colors.bold.red(`✗ ${event.type}`));

				event.errors.filter(e => !e.duplicate).forEach(error => {
					if (error.file) console.log(colors.bold(error.file));
					console.log(error.message);
				});

				const hidden = event.errors.filter(e => e.duplicate).length;
				if (hidden > 0) {
					console.log(`${hidden} duplicate ${hidden === 1 ? 'error' : 'errors'} hidden\n`);
				}
			} else if (event.warnings.length) {
				console.log(colors.bold.yellow(`• ${event.type}`));

				event.warnings.filter(e => !e.duplicate).forEach(warning => {
					if (warning.file) console.log(colors.bold(warning.file));
					console.log(warning.message);
				});

				const hidden = event.warnings.filter(e => e.duplicate).length;
				if (hidden > 0) {
					console.log(`${hidden} duplicate ${hidden === 1 ? 'warning' : 'warnings'} hidden\n`);
				}
			} else {
				console.log(`${colors.bold.green(`✔ ${event.type}`)} ${colors.gray(`(${prettyMs(event.duration)})`)}`);
			}
		});
	} catch (err) {
		console.log(colors.bold.red(`> ${err.message}`));
		process.exit(1);
	}
}