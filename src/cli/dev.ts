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

	function box(opts) {
		opts = Object.assign({
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
		}, opts);

		return blessed.box(opts);
	}

	const status_box = box({});
	const log_box = box({
		bottom: '0'
	});

	let mouse_is_down = false;
	let dragging = false;
	let did_drag = false;

	let divider_is_horizontal = true;

	function update_split(x: number, y: number) {
		if (divider_is_horizontal) {
			horizontal_divider.top = y;
			status_box.width = log_box.width = '100%';
			status_box.height = y;
			log_box.height = screen.height - (y + 1);
			log_box.top = y + 1;
			log_box.left = 0;
		} else {
			vertical_divider.left = x;
			status_box.height = log_box.height = '100%';
			status_box.width = x;
			log_box.width = screen.width - (x + 1);
			log_box.left = x + 1;
			log_box.top = 0;
		}

		screen.render();
	}

	screen.on('mousedown', data => {
		if (mouse_is_down) {
			if (dragging) {
				update_split(data.x, data.y);
				did_drag = true;
			}
		} else {
			if (data.y === horizontal_divider.top) {
				dragging = true;
			}

			mouse_is_down = true;
		}
	});

	screen.on('mouseup', data => {
		mouse_is_down = false;
		dragging = false;
		did_drag = false;
	});

	const horizontal_divider = blessed.line({
		top: '50%',
		orientation: 'horizontal'
	});

	const vertical_divider = blessed.line({
		left: '50%',
		orientation: 'vertical'
	});

	horizontal_divider.on('click', event => {
		if (!did_drag) {
			horizontal_divider.hide();
			vertical_divider.show();
			divider_is_horizontal = false;
			update_split(event.x, event.y);
		}
	});

	vertical_divider.on('click', event => {
		if (!did_drag) {
			vertical_divider.hide();
			horizontal_divider.show();
			divider_is_horizontal = true;
			update_split(event.x, event.y);
		}
	});

	vertical_divider.hide();

	screen.append(status_box);
	screen.append(log_box);
	screen.append(horizontal_divider);
	screen.append(vertical_divider);

	update_split(process.stdout.columns >> 1, process.stdout.rows >> 1);

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

	let first = true;

	return {
		stdout: append_log,

		stderr: append_log,

		clear_logs: () => {
			let content = `${colors.inverse(` server log • ${new Date().toISOString()}\n`)} \n`;
			if (first) {
				content += colors.gray(`> Click/drag the divider to adjust the split\n\n`);
				first = false;
			}

			log_box.setContent(content);
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