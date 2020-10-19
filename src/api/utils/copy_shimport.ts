import * as fs from 'fs';
import { version as shimport_version } from 'shimport/package.json';

export function copy_shimport(dest: string) {
	fs.writeFileSync(
		`${dest}/client/shimport@${shimport_version}.js`,
		fs.readFileSync(require.resolve('shimport/index.js'))
	);
}
