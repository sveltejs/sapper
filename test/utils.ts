import * as fs from 'fs';
import * as path from 'path';

export function wait(ms: number) {
	return new Promise(fulfil => setTimeout(fulfil, ms));
}

export function walk(cwd: string, dir = cwd, files: string[] = []) {
	fs.readdirSync(dir).forEach(file => {
		const resolved = path.resolve(dir, file);
		if (fs.statSync(resolved).isDirectory()) {
			walk(cwd, resolved, files);
		} else {
			files.push(posixify(path.relative(cwd, resolved)));
		}
	});

	return files;
}

function posixify(str: string) {
	return str.replace(/\\/g, '/');
}
