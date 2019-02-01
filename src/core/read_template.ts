import * as fs from 'fs';

export default function read_template(dir: string) {
	try {
		return fs.readFileSync(`${dir}/template.html`, 'utf-8');
	} catch (err) {
		if (fs.existsSync(`app/template.html`)) {
			throw new Error(`As of Sapper 0.21, the default folder structure has been changed:
  app/    --> src/
  routes/ --> src/routes/
  assets/ --> static/`);
		}

		throw err;
	}
}