import { export as _export } from '../api/export';
import colors from 'kleur';
import pb from 'pretty-bytes';
import { locations } from '../config';
import { left_pad } from '../utils';

export { __export as export };

function __export(export_dir: string, {
	basepath = '',
	timeout
}: {
	basepath: string,
	timeout: number | false
}) {
	return _export({
		build: locations.dest(),
		static: locations.static(),
		dest: export_dir,
		basepath,
		timeout,

		oninfo: event => {
			console.log(colors.bold.cyan(`> ${event.message}`));
		},

		onfile: event => {
			const size_color = event.size > 150000 ? colors.bold.red : event.size > 50000 ? colors.bold.yellow : colors.bold.gray;
				const size_label = size_color(left_pad(pb(event.size), 10));

				const file_label = event.status === 200
					? event.file
					: colors.bold[event.status >= 400 ? 'red' : 'yellow'](`(${event.status}) ${event.file}`);

				console.log(`${size_label}   ${file_label}`);
		}
	}).catch(err => {
		console.log(`${colors.bold.red(`> ${err.message}`)}`);
		process.exit(1);
	});
}