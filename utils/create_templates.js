const fs = require('fs');
const glob = require('glob');

module.exports = function create_templates() {
	const templates = glob.sync('*.html', { cwd: 'templates' })
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
				render(data) {
					return template.replace(/%sapper\.(\w+)%/g, (match, key) => {
						return key in data ? data[key] : '';
					});
				}
			}
		})
		.sort((a, b) => b.specificity - a.specificity);

	return {
		render: (status, data) => {
			const template = templates.find(template => template.test(status));
			if (template) return template.render(data);

			return `Missing template for status code ${status}`;
		}
	};
};