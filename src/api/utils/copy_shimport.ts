import * as fs from 'fs';
import { mkdirp } from './fs_utils';

export function copy_shimport(dest: string) {
	mkdirp(`${dest}/client/sapper`);

	const shimport_version = require('shimport/package.json').version;

	fs.writeFileSync(
		`${dest}/client/sapper/shimport@${shimport_version}.js`,
		fs.readFileSync(require.resolve('shimport/index.js'))
	);
}