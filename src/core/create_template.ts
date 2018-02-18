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
		},
		stream: (req: any, res: any, data: Record<string, string | Promise<string>>) => {
			let i = 0;

			let body = '';

			function stream_inner(): Promise<void> {
				if (i >= template.length) {
					return;
				}

				const start = template.indexOf('%sapper', i);

				if (start === -1) {
					const chunk = template.slice(i);
					body += chunk;
					res.end(chunk);

					if (process.send) {
						process.send({
							__sapper__: true,
							url: req.url,
							method: req.method,
							type: 'text/html',
							body
						});
					}

					return;
				}

				const chunk = template.slice(i, start);
				body += chunk;
				res.write(chunk);

				const end = template.indexOf('%', start + 1);
				if (end === -1) {
					throw new Error(`Bad template`); // TODO validate ahead of time
				}

				const tag = template.slice(start + 1, end);
				const match = /sapper\.(\w+)/.exec(tag);
				if (!match || !(match[1] in data)) throw new Error(`Bad template`); // TODO ditto

				return Promise.resolve(data[match[1]]).then(chunk => {
					body += chunk;
					res.write(chunk);
					i = end + 1;
					return stream_inner();
				});
			}

			return Promise.resolve().then(stream_inner);
		}
	};
}