import fs from 'fs';
import path from 'path';
import { SourceMapConsumer, RawSourceMap } from 'source-map';

function get_sourcemap_url(contents: string) {
	const reversed = contents
		.split('\n')
		.reverse()
		.join('\n');

	const match = /\/[/*]#[ \t]+sourceMappingURL=([^\s'"]+?)(?:[ \t]+|$)/gm.exec(reversed);
	if (match) return match[1];

	return undefined;
}

const file_cache = new Map<string, string>();

function get_file_contents(path: string) {
	if (file_cache.has(path)) {
		return file_cache.get(path);
	}

	try {
		const data = fs.readFileSync(path, 'utf8');
		file_cache.set(path, data);
		return data;
	} catch {
		return undefined;
	}
}

export function sourcemap_stacktrace(stack: string) {
	const replace = (line: string) =>
		line.replace(
			/^ {4}at (?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?)\)?/,
			(input, var_name, file_path, line, column) => {
				if (!file_path) return input;

				const contents = get_file_contents(file_path);
				if (!contents) return input;

				const sourcemap_path_or_base64 = get_sourcemap_url(contents);
				if (!sourcemap_path_or_base64) return input;

				let dir = path.dirname(file_path);
				let sourcemap_data: string;

				if (/^data:application\/json[^,]+base64,/.test(sourcemap_path_or_base64)) {
					const raw_data = sourcemap_path_or_base64.slice(sourcemap_path_or_base64.indexOf(',') + 1);
					try {
						sourcemap_data = Buffer.from(raw_data, 'base64').toString();
					} catch {
						return input;
					}
				} else {
					const abs_sourcemap_path = path.resolve(dir, sourcemap_path_or_base64);
					const data = get_file_contents(abs_sourcemap_path);

					if (!data) return input;

					sourcemap_data = data;
					dir = path.dirname(abs_sourcemap_path);
				}

				let raw_source_map: RawSourceMap;
				try {
					raw_source_map = JSON.parse(sourcemap_data);
				} catch {
					return input;
				}

				const consumer = new SourceMapConsumer(raw_source_map);
				const pos = consumer.originalPositionFor({
					line: Number(line),
					column: Number(column),
					bias: SourceMapConsumer.LEAST_UPPER_BOUND
				});

				if (!pos.source) return input;

				const abs_source_path = path.resolve(dir, pos.source);
				const url_part = `${abs_source_path}:${pos.line || 0}:${pos.column || 0}`;

				if (!var_name) return `    at ${url_part}`;
				return `    at ${var_name} (${url_part})`;
			}
		);

	file_cache.clear();

	return stack
		.split('\n')
		.map(replace)
		.join('\n');
}
