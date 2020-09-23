import * as fs from 'fs';
import * as path from 'path';
import { mkdirp } from './fs_utils';

const runtime = [
	'index.d.ts',
	...fs.readdirSync(path.join(__dirname, '../runtime')).filter(f => f.includes('.mjs')),
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
		fs.writeFileSync(`${output}/${file}`, source);
	});
}
