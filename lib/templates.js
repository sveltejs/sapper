const fs = require('fs');
const glob = require('glob');
const { dev } = require('./config.js');

let templates;

function create_templates() {
	templates = glob.sync('*.html', { cwd: 'templates' })
		.map(file => {
			const template = fs.readFileSync(`templates/${file}`, 'utf-8');
			const status = file.replace('.html', '').toLowerCase();

			if (!/^[0-9x]{3}$/.test(status)) {
				throw new Error(`Bad template — should be a valid status code like 404.html, or a wildcard like 2xx.html`);
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
				stream: async (res, data) => {
					let i = 0;

					do {
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

						res.write(await data[match[1]]);
						i = end + 1;
					} while (i < template.length);
				}
			};
		})
		.sort((a, b) => b.specificity - a.specificity);
}

create_templates();

if (dev) {
	const watcher = require('chokidar').watch('templates/**.html', {
		ignoreInitial: true,
		persistent: false
	});

	watcher.on('add', create_templates);
	watcher.on('change', create_templates);
	watcher.on('unlink', create_templates);
}

exports.render = (status, data) => {
	const template = templates.find(template => template.test(status));
	if (template) return template.render(data);

	return `Missing template for status code ${status}`;
};

exports.stream = (res, status, data) => {
	const template = templates.find(template => template.test(status));
	if (template) return template.stream(res, data);

	return `Missing template for status code ${status}`;
};
