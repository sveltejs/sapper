import * as fs from 'fs';
import chalk from 'chalk';
import framer from 'code-frame';
import { locate } from 'locate-character';

function error(e: any) {
	if (e.title) console.error(chalk.bold.red(e.title));
	if (e.body) console.error(chalk.red(e.body));
	if (e.url) console.error(chalk.cyan(e.url));
	if (e.frame) console.error(chalk.grey(e.frame));

	process.exit(1);
}

export default function create_templates() {
	const template = fs.readFileSync(`app/template.html`, 'utf-8');

	const index = template.indexOf('%sapper.main%');
	if (index !== -1) {
		// TODO remove this in a future version
		const { line, column } = locate(template, index, { offsetLine: 1 });
		const frame = framer(template, line, column);

		error({
			title: `app/template.html`,
			body: `<script src='%sapper.main%'> is unsupported — use %sapper.scripts% (without the <script> tag) instead`,
			url: 'https://github.com/sveltejs/sapper/issues/86',
			frame
		});
	}

	return {
		render: (data: Record<string, string>) => {
			return template.replace(/%sapper\.(\w+)%/g, (match, key) => {
				return key in data ? data[key] : '';
			});
		}
	};
}