import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('css-nested-layout', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('includes CSS defined in nested layout with server render', async () => {
		await r.load('/nested');

		assert.strictEqual(
			await r.page.$eval('h2', node => getComputedStyle(node).backgroundColor),
			'rgb(0, 128, 0)'
		);
	});

	it('includes CSS defined in component imported by nested layout with server render', async () => {
		await r.load('/nested');

		assert.strictEqual(
			await r.page.$eval('h3', node => getComputedStyle(node).backgroundColor),
			'rgb(255, 0, 0)'
		);
	});

	it('survives the tests with no server errors', () => {
		assert.deepStrictEqual(r.errors, []);
	});
});
