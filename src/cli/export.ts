import _exporter from '../api/export';
import * as colors from 'ansi-colors';
import prettyBytes from 'pretty-bytes';
import { locations } from '../config';

export function exporter(export_dir: string, { basepath = '' }) {
	return new Promise((fulfil, reject) => {
		try {
			const emitter = _exporter({
				build: locations.dest(),
				dest: export_dir,
				basepath
			});

			emitter.on('file', event => {
				console.log(`${colors.bold.cyan(event.file)} ${colors.gray(`(${prettyBytes(event.size)})`)}`);
			});

			emitter.on('failure', event => {
				console.log(`${colors.red(`> Received ${event.status} response when fetching ${event.pathname}`)}`);
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