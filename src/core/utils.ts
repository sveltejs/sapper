import * as fs from 'fs';

export function write(file: string, code: string) {
	fs.writeFileSync(file, code);
	fudge_mtime(file);
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