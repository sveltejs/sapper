import * as path from 'path';
import colors from 'kleur';
import * as child_process from 'child_process';
import * as blessed from 'blessed';
import prettyMs from 'pretty-ms';
import { dev as _dev } from '../api/dev';
import * as events from '../api/interfaces';

function boxed_output() {
	const screen = blessed.screen({
		smartCSR: true
	});

	const status_box = blessed.log({
		width: '100%',
		height: '50%',
		scrollable: true,
		style: {
			scrollbar: {
				bg: 'black'
			}
		},
		scrollbar: {},
		input: true,
		mouse: true,
		keys: true,
		scrollOnInput: false
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
		dragging = false;
	});

	const log_box = blessed.log({
		bottom: '0',
		width: '100%',
		height: '50%',
		scrollable: true,
		style: {
			scrollbar: {
				bg: 'black'
			}
		},
		scrollbar: {},
		input: true,
		mouse: true,
		keys: true,
		scrollOnInput: false
	});

	const divider = blessed.line({
		top: '50%',
		orientation: 'horizontal'
	});

	screen.append(status_box);
	screen.append(log_box);
	screen.append(divider);

	screen.key(['escape', 'q', 'C-c'], function(ch, key) {
		return process.exit(0);
	});

	const append_log = (data: Buffer | string) => {
		log_box.setContent(log_box.content + data);
		screen.render();
	};

	const append_status = (data: Buffer | string) => {
		status_box.setContent(status_box.content + data);
		screen.render();
	};

	return {
		stdout: append_log,

		stderr: append_log,

		clear_logs: () => {
			log_box.setContent(`${colors.inverse(` server log • ${new Date().toISOString()}\n`)} \n`);
			screen.render();
		},

		log: (line: string) => {
			append_status(line + '\n');
		},

		append: append_status,

		clear: () => {
			status_box.setContent(`${colors.inverse(` build log • ${new Date().toISOString()}\n`)} \n`);
			screen.render();
		}
	};
}

function streamed_output() {
	return {
		stdout: process.stdout.write.bind(process.stdout),

		stderr: process.stderr.write.bind(process.stderr),

		clear_logs: () => {},

		log: (line: string) => {
			console.log(line);
		},

		append: (data: Buffer | string) => {
			process.stdout.write(data);
		},

		clear: () => {}
	};
}

export function dev(opts: { port: number, open: boolean, bundler?: string, stream: boolean }) {
	const output = opts.stream
		? streamed_output()
		: boxed_output();

	output.clear();

	try {
		const watcher = _dev(opts);

		let first = true;

		watcher.on('ready', (event: events.ReadyEvent) => {
			output.log(colors.bold.cyan(`> Listening on http://localhost:${event.port}`));

			if (first) {
				if (opts.open) child_process.exec(`open http://localhost:${event.port}`);
				first = false;
			}
		});

		watcher.on('restart', output.clear_logs);
		watcher.on('stdout', output.stdout);
		watcher.on('stderr', output.stderr);

		watcher.on('invalid', (event: events.InvalidEvent) => {
			const changed = event.changed.map(filename => path.relative(process.cwd(), filename)).join(', ');

			output.clear();
			output.log(`${colors.bold.cyan(changed)} changed. rebuilding...`);
		});

		watcher.on('error', (event: events.ErrorEvent) => {
			output.log(colors.red(`✗ ${event.type}`));
			output.log(colors.red(event.message));
		});

		watcher.on('fatal', (event: events.FatalEvent) => {
			output.log(colors.bold.red(`> ${event.message}`));
			if (event.log) output.log(event.log);
		});

		watcher.on('build', (event: events.BuildEvent) => {
			if (event.errors.length) {
				output.log(colors.bold.red(`✗ ${event.type}`));

				event.errors.filter(e => !e.duplicate).forEach(error => {
					if (error.file) output.log(colors.bold(error.file));
					output.log(error.message);
				});

				const hidden = event.errors.filter(e => e.duplicate).length;
				if (hidden > 0) {
					output.log(`${hidden} duplicate ${hidden === 1 ? 'error' : 'errors'} hidden\n`);
				}
			} else if (event.warnings.length) {
				output.log(colors.bold.yellow(`• ${event.type}`));

				event.warnings.filter(e => !e.duplicate).forEach(warning => {
					if (warning.file) output.log(colors.bold(warning.file));
					output.log(warning.message);
				});

				const hidden = event.warnings.filter(e => e.duplicate).length;
				if (hidden > 0) {
					output.log(`${hidden} duplicate ${hidden === 1 ? 'warning' : 'warnings'} hidden\n`);
				}
			} else {
				output.log(`${colors.bold.green(`✔ ${event.type}`)} ${colors.gray(`(${prettyMs(event.duration)})`)}`);
			}
		});
	} catch (err) {
		output.log(colors.bold.red(`> ${err.message}`));
		process.exit(1);
	}
}