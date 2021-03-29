import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('csp-nonce', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	it('includes a script nonce', async () => {
		await r.load('/');

		assert.strictEqual(
			await r.page.$eval('script:not([src])', node => node.getAttribute('nonce')),
			'nonce'
		);
	});

	it('includes a style nonce', async () => {
		await r.load('/');

		assert.strictEqual(
			await r.page.$eval('style', node => node.getAttribute('nonce')),
			'nonce'
		);
	});
});
