import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('ignore', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('respects `options.ignore` values (RegExp)', async () => {
		await r.load('/foobar');

		assert.equal(
			await r.text('body'),
			'foobar'
		);
	});

	it('respects `options.ignore` values (String #1)', async () => {
		await r.load('/buzz');

		assert.equal(
			await r.text('body'),
			'buzz'
		);
	});

	it('respects `options.ignore` values (String #2)', async () => {
		await r.load('/fizzer');

		assert.equal(
			await r.text('body'),
			'fizzer'
		);
	});

	it('respects `options.ignore` values (Function)', async () => {
		await r.load('/hello');

		assert.equal(
			await r.text('body'),
			'hello'
		);
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
