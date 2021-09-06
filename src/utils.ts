import * as fs from 'fs';
import * as path from 'path';

export const get_watcher_on_invalid_current_name = (object: object) => {
	for (const key in object) {
		if ( object[key] === true ) return key;
	}
};

export function left_pad(str: string, len: number) {
	while (str.length < len) str = ` ${str}`;
	return str;
}

export function repeat(str: string, i: number) {
	let result = '';
	while (i--) result += str;
	return result;
}

const convertMsToSec = (ms: number) => Math.round(ms / 1000);
const convertMsToMin = (ms: number) => Math.floor(ms / 60000);
export const formatMs = (ms: number) => {
	if ( ms < 1000 ) 					return `${ms}ms`;
	if ( ms >= 1000 && ms < 60000 ) 	return `${convertMsToSec(ms)}s`;
	if ( ms >= 60000 ) 					return `${convertMsToMin(ms)}m`;
};

export function elapsed(start: number) {
	return formatMs(Date.now() - start);
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

export function posixify(str: string) {
	return str.replace(/\\/g, '/');
}

const previous_contents = new Map();

export function write_if_changed(file: string, code: string) {
	if (code !== previous_contents.get(file)) {
		previous_contents.set(file, code);
		fs.writeFileSync(file, code);
		fudge_mtime(file);
	}
}

export function stringify(string: string, includeQuotes = true) {
	const quoted = JSON.stringify(string);
	return includeQuotes ? quoted : quoted.slice(1, -1);
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

export const reserved_words = new Set([
	'arguments',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'eval',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'implements',
	'import',
	'in',
	'instanceof',
	'interface',
	'let',
	'new',
	'null',
	'package',
	'private',
	'protected',
	'public',
	'return',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield'
]);

export function normalize_path(user_path) {
	const p = path.normalize(user_path);
	// normalize drive letter on Windows
	return p.length ? p.charAt(0).toLowerCase() + p.slice(1) : '';
}
