import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('preprocess', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('respects `options.preprocess` data replacement', async () => {
		await r.load('/');

		assert.equal(
			await r.text('#test'),
			'works!'
		);
	});

	it('respects `options.preprocess` data replacement on error page', async () => {
		await r.load('/error-page');

		assert.equal(
			await r.text('#test'),
			'works!'
		);
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
