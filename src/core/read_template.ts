import * as fs from 'fs';
import * as path from 'path'
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
		// use fallback template
		const fallbackPath = path.resolve(__dirname, '../runtime/internal/template.html')
		return fs.readFileSync(fallbackPath, 'utf-8')
	}
}