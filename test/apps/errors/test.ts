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

	it('display correct stack trace sequences on server error referring to source file', async () => {
		await r.load('/trace');

		const stack = (await r.text('span')).split('\n');

		assert.ok(stack[1] && stack[1].includes('_trace.js:2:11'));
		assert.ok(stack[2] && stack[2].includes('trace.svelte:5:6'));
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
