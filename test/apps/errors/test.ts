import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';

describe('errors', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('handles missing route on server', async () => {
		await r.load('/nope');

		assert.equal(
			await r.text('h1'),
			'404'
		);
	});

	it('handles missing route on client', async () => {
		await r.load('/');
		await r.sapper.start();

		await r.page.click('[href="nope"]');
		await r.wait();

		assert.equal(
			await r.text('h1'),
			'404'
		);
	});

	it('handles explicit 4xx on server', async () => {
		await r.load('/blog/nope');

		assert.equal(
			await r.text('h1'),
			'404'
		);
	});

	it('handles explicit 4xx on client', async () => {
		await r.load('/');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="blog/nope"]');
		await r.wait();

		assert.equal(
			await r.text('h1'),
			'404'
		);
	});

	it('handles error on server', async () => {
		await r.load('/throw');

		assert.equal(
			await r.text('h1'),
			'500'
		);
	});

	it('handles error on client', async () => {
		await r.load('/');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="throw"]');
		await r.wait();

		assert.equal(
			await r.text('h1'),
			'500'
		);
	});

	// https://github.com/sveltejs/sapper/issues/710
	// 
	// In reported issue, error elements disappear, which is not the case in
	// our test case. This is because the default layout `<slot/>` does not
	// try to reclaim anything. Reporter probably has a custom `_layout.svelte`
	// with some divs etc., and those will clear the existing DOM (if they
	// don't find their element?).
	// 
	// Here we're not testing that the error is still here, but that the page 
	// component has not been rendered (since only error page should be rendered 
	// here). So we don't need a custom layout.
	// 
	it('does not replace server side rendered error', async () => {
		await r.load('/preload-reject');
		await r.sapper.start();

		assert.equal(
			await r.text('h1'),
			'500'
		);
	});

	it('does not serve error page for explicit non-page errors', async () => {
		await r.load('/nope.json');

		assert.equal(
			await r.text('body'),
			'nope'
		);
	});

	it('does not serve error page for thrown non-page errors', async () => {
		await r.load('/throw.json');

		assert.equal(
			await r.text('body'),
			'oops'
		);
	});

	it('execute error page hooks', async () => {
		await r.load('/some-throw-page');
		await r.sapper.start();

		assert.equal(
			await r.text('h2'),
			'success'
		);
	})

	it('does not serve error page for async non-page error', async () => {
		await r.load('/async-throw.json');

		assert.equal(
			await r.text('body'),
			'oops'
		);
	});

	it('clears props.error on successful render', async () => {
		await r.load('/no-error');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="enhance-your-calm"]');
		await r.wait();
		assert.equal(await r.text('h1'), '420');

		await r.page.goBack();
		await r.wait();
		assert.equal(await r.text('h1'), 'No error here');
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
