import { exporter as _exporter } from '../api/export';
import colors from 'kleur';
import pb from 'pretty-bytes';
import { locations } from '../config';
import { left_pad } from '../utils';

export function exporter(export_dir: string, {
	basepath = '',
	timeout
}: {
	basepath: string,
	timeout: number | false
}) {
	return new Promise((fulfil, reject) => {
		try {
			const emitter = _exporter({
				build: locations.dest(),
				static: locations.static(),
				dest: export_dir,
				basepath,
				timeout
			});

			emitter.on('file', event => {
				const size_color = event.size > 150000 ? colors.bold.red : event.size > 50000 ? colors.bold.yellow : colors.bold.gray;
				const size_label = size_color(left_pad(pb(event.size), 10));

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