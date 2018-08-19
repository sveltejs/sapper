import { exporter as _exporter } from '../api/export';
import colors from 'kleur';
import prettyBytes from 'pretty-bytes';
import { locations } from '../config';

function left_pad(str: string, len: number) {
	while (str.length < len) str = ` ${str}`;
	return str;
}

export function exporter(export_dir: string, { basepath = '' }) {
	return new Promise((fulfil, reject) => {
		try {
			const emitter = _exporter({
				build: locations.dest(),
				dest: export_dir,
				basepath
			});

			emitter.on('file', event => {
				const pb = prettyBytes(event.size);
				const size_color = event.size > 150000 ? colors.bold.red : event.size > 50000 ? colors.bold.yellow : colors.bold.gray;
				const size_label = size_color(left_pad(prettyBytes(event.size), 10));

				const file_label = event.status === 200
					? event.file
					: colors.bold[event.status >= 400 ? 'red' : 'yellow'](`(${event.status}) ${event.file}`);

				console.log(`${size_label}   ${file_label}`);
			});

			emitter.on('info', event => {
				console.log(colors.bold.cyan(`> ${event.message}`));
			});

			emitter.on('error', event => {
				reject(event.error);
			});

			emitter.on('done', event => {
				fulfil();
			});
		} catch (err) {
			console.log(`${colors.bold.red(`> ${err.message}`)}`);
			process.exit(1);
		}
	});
}