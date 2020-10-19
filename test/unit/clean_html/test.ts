import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import clean_html from '../../../src/api/utils/clean_html';

describe('clean_html', () => {
	const samples = path.join(__dirname, 'samples');

	fs.readdirSync(samples).forEach(dir => {
		if (dir[0] === '.') return;

		it(dir, () => {
			const input = fs.readFileSync(`${samples}/${dir}/input.html`, 'utf-8');
			const expected = fs.readFileSync(`${samples}/${dir}/output.html`, 'utf-8');

			const actual = clean_html(input);

			fs.writeFileSync(`${samples}/${dir}/.actual.html`, actual);

			assert.equal(
				actual.replace(/\s+$/gm, ''),
				expected.replace(/\s+$/gm, '')
			);
		});
	});
});
