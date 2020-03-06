import * as fs from 'fs';
import * as path from 'path';
import hash from 'string-hash';

export default function inject_version_to_template_assets(template: string, static_files: string) {
	const files = fs.readdirSync(static_files);
	for (const file of files) {
		const filePath = path.join(static_files, file);

		if (template.includes(file) && fs.existsSync(filePath)) {
			const hashedInt = hash(fs.readFileSync(filePath).toString());
			const hashedStr = hashedInt.toString(16);
			template = template.replace(file, `${file}?v=${hashedStr}`);
		}
	}

	return template;
}
