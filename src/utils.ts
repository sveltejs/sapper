import * as fs from 'fs';

export function exists(file: string) {
	try {
		fs.statSync(file);
		return true;
	} catch (err) {
		return false;
	}
}