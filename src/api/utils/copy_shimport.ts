import * as fs from 'fs';

export function copy_shimport(dest: string) {
	const shimport_version = require('shimport/package.json').version;
	fs.writeFileSync(
		`${dest}/client/shimport@${shimport_version}.js`,
		fs.readFileSync(require.resolve('shimport/index.js'))
	);
}