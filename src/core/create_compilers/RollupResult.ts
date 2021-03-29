import * as path from 'path';
import colors from 'kleur';
import pb from 'pretty-bytes';
import RollupCompiler from './RollupCompiler';
import { left_pad, normalize_path } from '../../utils';
import { CompileResult, BuildInfo, CompileError, Chunk } from './interfaces';
import { ManifestData, Dirs } from '../../interfaces';
import { version as shimport_version} from 'shimport/package.json';

export default class RollupResult implements CompileResult {
	duration: number;
	errors: CompileError[];
	warnings: CompileError[];
	chunks: Chunk[];
	assets: Record<string, string>;
	css: {	
		main: string[];
	};
	dependencies: Record<string, string[]>;
	sourcemap: boolean | 'inline';
	summary: string;

	constructor(duration: number, compiler: RollupCompiler, sourcemap: boolean | 'inline') {
		this.duration = duration;
		this.sourcemap = sourcemap;

		this.errors = compiler.errors.map(munge_warning_or_error);
		this.warnings = compiler.warnings.map(munge_warning_or_error);

		this.chunks = compiler.chunks.map(chunk => ({
			file: chunk.fileName,
			imports: chunk.imports.filter(Boolean),
			modules: Object.keys(chunk.modules).map(m => normalize_path(m))
		}));

		this.dependencies = compiler.dependencies;

		this.assets = {
			main: compiler.js_main
		};
		this.css = {
			main: compiler.css_main
		};

		this.summary = compiler.chunks.map(chunk => {
			const size_color = chunk.code.length > 150000 ? colors.bold().red : chunk.code.length > 50000 ? colors.bold().yellow : colors.bold().white;
			const size_label = left_pad(pb(chunk.code.length), 10);

			const lines = [size_color(`${size_label} ${chunk.fileName}`)];

			const deps = Object.keys(chunk.modules)
				.map(file => {
					return {
						file: path.relative(process.cwd(), file),
						size: chunk.modules[file].renderedLength
					};
				})
				.filter(dep => dep.size > 0)
				.sort((a, b) => b.size - a.size);

			const total_unminified = deps.reduce((t, d) => t + d.size, 0);

			deps.forEach((dep, i) => {
				const c = i === deps.length - 1 ? '└' : '│';
				let line = `           ${c} ${dep.file}`;

				if (deps.length > 1) {
					const p = (100 * dep.size / total_unminified).toFixed(1);
					line += ` (${p}%)`;
				}

				lines.push(colors.gray(line));
			});

			return lines.join('\n');
		}).join('\n');
	}

	relative_dependencies(routes_dir: string) {
		const dependencies = {};
		Object.entries(this.dependencies).forEach(([key, value]) => {
			dependencies[normalize_path(path.relative(routes_dir, key)).replace(/\\/g, '/')] = value;
		});
		return dependencies;
	}

	to_json(manifest_data: ManifestData, dirs: Dirs): BuildInfo {
		const dependencies = (this.relative_dependencies(dirs.routes));
		return {
			bundler: 'rollup',
			shimport: shimport_version,
			assets: this.assets,
			css: this.css,
			dependencies
		};
	}

	print() {
		const blocks: string[] = this.warnings.map(warning => {
			return warning.file
				? `> ${colors.bold(warning.file)}\n${warning.message}`
				: `> ${warning.message}`;
		});

		blocks.push(this.summary);

		return blocks.join('\n\n');
	}
}

function munge_warning_or_error(warning_or_error: any) {
	return {
		file: warning_or_error.filename,
		message: [warning_or_error.message, warning_or_error.frame].filter(Boolean).join('\n')
	};
}

