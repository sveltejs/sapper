import * as fs from 'fs';
import * as path from 'path';

export function mkdirp(dir: string) {
	const parent = path.dirname(dir);
	if (parent === dir) return;

	mkdirp(parent);

	try {
		fs.mkdirSync(dir);
	} catch (err) {
		// ignore
	}
}

export function rimraf(thing: string) {
	if (!fs.existsSync(thing)) return;

	const stats = fs.statSync(thing);

	if (stats.isDirectory()) {
		fs.readdirSync(thing).forEach(file => {
			rimraf(path.join(thing, file));
		});

		fs.rmdirSync(thing);
	} else {
		fs.unlinkSync(thing);
	}
}

export function copy(from: string, to: string) {
	if (!fs.existsSync(from)) return;

	const stats = fs.statSync(from);

	if (stats.isDirectory()) {
		fs.readdirSync(from).forEach(file => {
			copy(path.join(from, file), path.join(to, file));
		});
	} else {
		mkdirp(path.dirname(to));
		fs.writeFileSync(to, fs.readFileSync(from));
		fs.utimesSync(to, stats.atime, stats.mtime);
	}
}
