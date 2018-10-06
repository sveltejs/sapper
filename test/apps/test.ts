import * as fs from 'fs';
import * as path from 'path';

fs.readdirSync(__dirname).forEach(dir => {
	if (dir[0] === '.' || dir === 'test.ts') return;

	const resolved = path.resolve(__dirname, dir);
	if (!fs.statSync(resolved).isDirectory()) return;

	describe(dir, () => {
		require(`${resolved}/__test__.ts`);
	});
});