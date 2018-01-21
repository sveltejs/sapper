import * as fs from 'fs';
import glob from 'glob';
import chalk from 'chalk';
import framer from 'code-frame';
import { locate } from 'locate-character';

let templates;

function error(e) {
	if (e.title) console.error(chalk.bold.red(e.title));
	if (e.body) console.error(chalk.red(e.body));
	if (e.url) console.error(chalk.cyan(e.url));
	if (e.frame) console.error(chalk.grey(e.frame));

	process.exit(1);
}

export function create_templates() {
	templates = glob.sync('*.html', { cwd: 'templates' })
		.map(file => {
			const template = fs.readFileSync(`templates/${file}`, 'utf-8');
			const status = file.replace('.html', '').toLowerCase();

			if (!/^[0-9x]{3}$/.test(status)) {
				error({
					title: `templates/${file}`,
					body: `Bad template — should be a valid status code like 404.html, or a wildcard like 2xx.html`
				});
			}

			const index = template.indexOf('%sapper.main%');
			if (index !== -1) {
				// TODO remove this in a future version
				const { line, column } = locate(template, index, { offsetLine: 1 });
				const frame = framer(template, line, column);

				error({
					title: `templates/${file}`,
					body: `<script src='%sapper.main%'> is unsupported — use %sapper.scripts% (without the <script> tag) instead`,
					url: 'https://github.com/sveltejs/sapper/issues/86',
					frame
				});
			}

			const specificity = (
				(status[0] === 'x' ? 0 : 4) +
				(status[1] === 'x' ? 0 : 2) +
				(status[2] === 'x' ? 0 : 1)
			);

			const pattern = new RegExp(`^${status.split('').map(d => d === 'x' ? '\\d' : d).join('')}$`);

			return {
				test: status => pattern.test(status),
				specificity,
				render: data => {
					return template.replace(/%sapper\.(\w+)%/g, (match, key) => {
						return key in data ? data[key] : '';
					});
				},
				stream: (res, data) => {
					let i = 0;

					function stream_inner() {
						if (i >= template.length) {
							return;
						}

						const start = template.indexOf('%sapper', i);

						if (start === -1) {
							res.end(template.slice(i));
							return;
						}

						res.write(template.slice(i, start));

						const end = template.indexOf('%', start + 1);
						if (end === -1) {
							throw new Error(`Bad template`); // TODO validate ahead of time
						}

						const tag = template.slice(start + 1, end);
						const match = /sapper\.(\w+)/.exec(tag);
						if (!match || !(match[1] in data)) throw new Error(`Bad template`); // TODO ditto

						return Promise.resolve(data[match[1]]).then(datamatch => {
							res.write(datamatch);
							i = end + 1;
							return stream_inner();
						});
					}

					return Promise.resolve().then(stream_inner);
				}
			};
		})
		.sort((a, b) => b.specificity - a.specificity);
}

export function render(status, data) {
	const template = templates.find(template => template.test(status));
	if (template) return template.render(data);

	return `Missing template for status code ${status}`;
}

export function stream(res, status, data) {
	const template = templates.find(template => template.test(status));
	if (template) return template.stream(res, data);

	return `Missing template for status code ${status}`;
}
