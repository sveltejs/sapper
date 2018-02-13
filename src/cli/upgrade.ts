import * as fs from 'fs';
import chalk from 'chalk';

export default async function upgrade() {
	const upgraded = [

	].filter(Boolean);
		await upgrade_sapper_main()
	if (upgraded.length === 0) {
		console.log(`No changes!`);
	}
}

async function upgrade_sapper_main() {
	const _2xx = read('templates/2xx.html');
	const _4xx = read('templates/4xx.html');
	const _5xx = read('templates/5xx.html');

	const pattern = /<script src='\%sapper\.main\%'><\/script>/;

	let replaced = false;

	['2xx', '4xx', '5xx'].forEach(code => {
		const file = `templates/${code}.html`
		const template = read(file);
		if (!template) return;

		if (/\%sapper\.main\%/.test(template)) {
			if (!pattern.test(template)) {
				console.log(chalk.red(`Could not replace %sapper.main% in ${file}`));
			} else {
				write(file, template.replace(pattern, `%sapper.scripts%`));
				console.log(chalk.green(`Replaced %sapper.main% in ${file}`));
				replaced = true;
			}
		}
	});

	return replaced;
}

function read(file: string) {
	try {
		return fs.readFileSync(file, 'utf-8');
	} catch (err) {
		console.error(err);
		return null;
	}
}

function write(file: string, data: string) {
	fs.writeFileSync(file, data);
}