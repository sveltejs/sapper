import mime_raw from './mime-types.md';

const map: Map<string, string> = new Map();

mime_raw.split('\n').forEach((row: string) => {
	const match = /(.+?)\t+(.+)/.exec(row);
	if (!match) return;

	const type = match[1];
	const extensions = match[2].split(' ');

	extensions.forEach(ext => {
		map.set(ext, type);
	});
});

export function lookup(file: string) {
	const match = /\.([^\.]+)$/.exec(file);
	return match && map.get(match[1]);
}