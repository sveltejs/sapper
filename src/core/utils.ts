import * as fs from 'fs';

const previous_contents = new Map();

export function write_if_changed(file: string, code: string) {
	if (code !== previous_contents.get(file)) {
		previous_contents.set(file, code);
		fs.writeFileSync(file, code);
		fudge_mtime(file);
	}
}

export function posixify(file: string) {
	return file.replace(/[/\\]/g, '/');
}

export function fudge_mtime(file: string) {
	// need to fudge the mtime so that webpack doesn't go doolally
	const { atime, mtime } = fs.statSync(file);
	fs.utimesSync(
		file,
		new Date(atime.getTime() - 999999),
		new Date(mtime.getTime() - 999999)
	);
}