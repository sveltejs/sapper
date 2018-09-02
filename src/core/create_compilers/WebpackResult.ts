import format_messages from 'webpack-format-messages';
import { CompileResult, BuildInfo, CompileError, Chunk, CssFile } from './interfaces';

const locPattern = /\((\d+):(\d+)\)$/;

function munge_warning_or_error(message: string) {
	// TODO this is all a bit rube goldberg...
	const lines = message.split('\n');

	const file = lines.shift()
		.replace('[7m', '') // careful — there is a special character at the beginning of this string
		.replace('[27m', '')
		.replace('./', '');

	let line = null;
	let column = null;

	const match = locPattern.exec(lines[0]);
	if (match) {
		lines[0] = lines[0].replace(locPattern, '');
		line = +match[1];
		column = +match[2];
	}

	return {
		file,
		message: lines.join('\n')
	};
}

export default class WebpackResult implements CompileResult {
	duration: number;
	errors: CompileError[];
	warnings: CompileError[];
	chunks: Chunk[];
	assets: Record<string, string>;
	css_files: CssFile[];
	stats: any;

	constructor(stats: any) {
		this.stats = stats;

		const info = stats.toJson();

		const messages = format_messages(stats);

		this.errors = messages.errors.map(munge_warning_or_error);
		this.warnings = messages.warnings.map(munge_warning_or_error);

		this.duration = info.time;

		this.chunks = info.assets.map((chunk: { name: string }) => ({ file: chunk.name }));
		this.assets = info.assetsByChunkName;
	}

	to_json(): BuildInfo {
		return {
			bundler: 'webpack',
			shimport: null, // webpack has its own loader
			assets: this.assets,
			css: {
				// TODO
				main: null,
				chunks: {}
			}
		};
	}

	print() {
		return this.stats.toString({ colors: true });
	}
}