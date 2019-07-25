import * as fs from 'fs';
import { sync as writeFileSync } from 'write-file-atomic';
import * as path from 'path';
import { mkdirp } from './fs_utils';

const runtime = [
	'app.mjs',
	'server.mjs',
	'internal/shared.mjs',
	'internal/layout.svelte',
	'internal/error.svelte'
].map(file => ({
	file,
	source: fs.readFileSync(path.join(__dirname, `../runtime/${file}`), 'utf-8')
}));

export function copy_runtime(output: string) {
	runtime.forEach(({ file, source }) => {
		mkdirp(path.dirname(`${output}/${file}`));
		writeFileSync(`${output}/${file}`, source);
	});
}
