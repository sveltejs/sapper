import * as fs from 'fs';
import { locations } from '../config';

export default function read_template(dir = locations.src()) {
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