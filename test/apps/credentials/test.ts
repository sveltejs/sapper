import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('credentials', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('sends cookies when using this.fetch with credentials: "include"', async () => {
		await r.load('/credentials?creds=include');

		assert.equal(
			await r.text('h1'),
			'a: 1, b: 2, max-age: undefined'
		);
	});

	it('does not send cookies when using this.fetch without credentials', async () => {
		await r.load('/credentials');

		assert.equal(
			await r.text('h1'),
			'unauthorized'
		);
	});

	it('delegates to fetch on the client', async () => {
		await r.load('/')
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="credentials?creds=include"]');
		await r.wait();

		assert.equal(
			await r.text('h1'),
			'a: 1, b: 2, max-age: undefined'
		);
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
