import * as path from 'path';
import colors from 'kleur';
import * as child_process from 'child_process';
import * as blessed from 'blessed';
import prettyMs from 'pretty-ms';
import { dev as _dev } from '../api/dev';
import * as events from '../api/interfaces';

export function dev(opts: { port: number, open: boolean, bundler?: string }) {
	const screen = blessed.screen({
		smartCSR: true
	});

	const status_box = blessed.box({
		width: '100%',
		height: '50%',
		scrollable: true
	});

	let mouse_is_down = false;
	let dragging = false;

	screen.on('mousedown', data => {
		if (mouse_is_down) {
			if (dragging) {
				divider.top = data.y;
				status_box.height = data.y;
				log_box.height = screen.height - (data.y + 1);
				screen.render();
			}
		} else {
			if (data.y === divider.top) {
				dragging = true;
			}

			mouse_is_down = true;
		}
	});

	screen.on('mouseup', data => {
		mouse_is_down = false;
	});

	const log_box = blessed.box({
		bottom: '0',
		width: '100%',
		height: '50%',
		scrollable: true
	});

	const divider = blessed.line({
		top: '50%',
		orientation: 'horizontal'
	});

	screen.append(status_box);
	screen.append(log_box);
	screen.append(divider);
	screen.render();

	screen.key(['escape', 'q', 'C-c'], function(ch, key) {
		return process.exit(0);
	});

	const append_log = data => {
		log_box.setContent(log_box.getContent() + data);
		screen.render();
	};

	const append_status = line => {
		const lines = status_box.getLines();
		status_box.insertLine(lines.length, line);
		screen.render();
	};

	try {
		const watcher = _dev(opts);

		let first = true;

		watcher.on('ready', (event: events.ReadyEvent) => {
			if (first) {
				append_status(colors.bold.cyan(`> Listening on http://localhost:${event.port}`));
				if (opts.open) child_process.exec(`open http://localhost:${event.port}`);
				first = false;
			}

			event.process.stdout.on('data', append_log);
			event.process.stderr.on('data', append_log);
		});

		watcher.on('invalid', (event: events.InvalidEvent) => {
			const changed = event.changed.map(filename => path.relative(process.cwd(), filename)).join(', ');
			status_box.setContent('');
			append_status(`\n${colors.bold.cyan(changed)} changed. rebuilding...`);
		});

		watcher.on('error', (event: events.ErrorEvent) => {
			append_status(colors.red(`✗ ${event.type}`));
			append_status(colors.red(event.message));
		});

		watcher.on('fatal', (event: events.FatalEvent) => {
			append_status(colors.bold.red(`> ${event.message}`));
			if (event.log) append_status(event.log);
		});

		watcher.on('build', (event: events.BuildEvent) => {
			if (event.errors.length) {
				append_status(colors.bold.red(`✗ ${event.type}`));

				event.errors.filter(e => !e.duplicate).forEach(error => {
					if (error.file) append_status(colors.bold(error.file));
					append_status(error.message);
				});

				const hidden = event.errors.filter(e => e.duplicate).length;
				if (hidden > 0) {
					append_status(`${hidden} duplicate ${hidden === 1 ? 'error' : 'errors'} hidden\n`);
				}
			} else if (event.warnings.length) {
				append_status(colors.bold.yellow(`• ${event.type}`));

				event.warnings.filter(e => !e.duplicate).forEach(warning => {
					if (warning.file) append_status(colors.bold(warning.file));
					append_status(warning.message);
				});

				const hidden = event.warnings.filter(e => e.duplicate).length;
				if (hidden > 0) {
					append_status(`${hidden} duplicate ${hidden === 1 ? 'warning' : 'warnings'} hidden\n`);
				}
			} else {
				append_status(`${colors.bold.green(`✔ ${event.type}`)} ${colors.gray(`(${prettyMs(event.duration)})`)}`);
			}
		});
	} catch (err) {
		append_status(colors.bold.red(`> ${err.message}`));
		process.exit(1);
	}
}