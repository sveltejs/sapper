import * as fs from 'fs';
import { sync as writeFileSync } from 'write-file-atomic';

export function copy_shimport(dest: string) {
	const shimport_version = require('shimport/package.json').version;
	writeFileSync(
		`${dest}/client/shimport@${shimport_version}.js`,
		fs.readFileSync(require.resolve('shimport/index.js'))
	);
}
