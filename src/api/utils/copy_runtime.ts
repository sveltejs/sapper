import * as fs from 'fs';
import * as path from 'path';
import relative from 'require-relative';
import { mkdirp } from './fs_utils';

const svelte_pkg = relative('svelte/package.json', process.cwd());
const match = /(\d+)\.(\d+)\.(\d+)/.exec(svelte_pkg.version);
const legacy = match
	? ((+match[1] - 3) || (+match[2] - 4) || (+match[3] - 4)) <= 0
	: false; // ???

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

		if (!legacy) source = source.replace(/svelte\/(.+)\.mjs/g, `svelte/$1/index.mjs`);
		fs.writeFileSync(`${output}/${file}`, source);
	});
}