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
		r.page.setExtraHTTPHeaders({
			authorization: 'my-auth'
		});
	});

	after(() => r && r.end());

	// cookie tests
	it('sends cookies when using this.fetch with credentials: "include"', async () => {
		await r.load('/credentials?creds=include&type=cookie');

		assert.equal(
			await r.text('h1'),
			'a: 1, b: 2, max-age: undefined'
		);
	});

	it('does not send cookies when using this.fetch with credentials: "omit"', async () => {
		await r.load('/credentials?creds=omit&type=cookie');

		assert.equal(
			await r.text('h1'),
			'unauthorized'
		);
	});

	it('sends cookies to same origin when using this.fetch without credentials', async () => {
		await r.load('/credentials?type=cookie');

		assert.equal(
			await r.text('h1'),
			'a: 1, b: 2, max-age: undefined'
		);
	});

	// TODO: write a test for not sending cookies to different origin with credentials: "same-origin"

	// authorization header test
	it('sends authorization when using this.fetch with credentials: "include"', async () => {
		await r.load('/credentials?creds=include&type=authorization');

		assert.equal(
			await r.text('h1'),
			'my-auth'
		);
	});

	it('does not send authorization when using this.fetch with credentials: "omit"', async () => {
		await r.load('/credentials?creds=omit&type=authorization');

		assert.equal(
			await r.text('h1'),
			'unauthorized'
		);
	});

	it('sends authorization to same origin when using this.fetch without credentials', async () => {
		await r.load('/credentials?type=authorization');

		assert.equal(
			await r.text('h1'),
			'my-auth'
		);
	});

	// TODO: write a test for not sending authorization to different origin with credentials: "same-origin"

	it('delegates to fetch on the client', async () => {
		await r.load('/');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('#cookie');
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
