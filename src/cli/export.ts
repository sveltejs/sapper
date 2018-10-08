import * as path from 'path';
import { export as _export } from '../api/export';
import colors from 'kleur';
import pb from 'pretty-bytes';
import { left_pad } from '../utils';

export { __export as export };

function __export(export_dir: string, {
	build_dir,
	basepath = '',
	timeout
}: {
	build_dir: string,
	basepath?: string,
	timeout: number | false
}) {
	const cwd = path.resolve(process.env.SAPPER_BASE || '');

	return _export({
		static: path.resolve(cwd, process.env.SAPPER_STATIC || 'static'),
		build_dir,
		export_dir,
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