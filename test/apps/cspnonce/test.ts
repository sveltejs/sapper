import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('cspnonce', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	it('sapper.cspnonce replaced with CSP nonce \'rAnd0m123\' injected via \'res.locals.nonce\'', async () => {
		await r.load('/');

		assert.equal(
			await r.page.$eval('#hasNonce', node => node.getAttribute('nonce')), 'rAnd0m123'
		);
		assert.equal(
			await r.page.$eval('#hasNonceAgain', node => node.getAttribute('nonce')), 'rAnd0m123'
		);
	});

});
