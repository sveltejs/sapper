import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';

const runtime = [
	'app.mjs',
	'server.mjs',
	'internal/shared.mjs',
	'internal/Sapper.html',
	'internal/layout.html'
].map(file => ({
	file,
	source: fs.readFileSync(path.join(__dirname, `../runtime/${file}`), 'utf-8')
}));

export function copy_runtime(output: string) {
	runtime.forEach(({ file, source }) => {
		mkdirp.sync(path.dirname(`${output}/${file}`));
		fs.writeFileSync(`${output}/${file}`, source);
	});
}