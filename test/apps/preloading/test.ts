import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

declare const fulfil: () => Promise<void>;

describe('preloading', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('serializes Set objects returned from preload', async () => {
		await r.load('/preload-values/set');

		assert.equal(await r.text('h1'), 'true');

		await r.sapper.start();
		assert.equal(await r.text('h1'), 'true');
	});

	it('prevent crash if preload return nothing', async () => {
		await r.load('/preload-nothing');

		await r.sapper.start();

		assert.equal(await r.text('h1'), 'Page loaded');
	});

	it('bails on custom classes returned from preload', async () => {
		await r.load('/preload-values/custom-class');

		assert.equal(await r.text('h1'), '42');

		await r.sapper.start();
		assert.equal(await r.text('h1'), '42');
	});

	it('sets preloading true when appropriate', async () => {
		await r.load('/');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('a[href="slow-preload"]');

		assert.ok(await r.page.evaluate(() => !!document.querySelector('progress')));

		await r.page.evaluate(() => fulfil());
		assert.ok(await r.page.evaluate(() => !document.querySelector('progress')));
	});

	it('runs preload in root component', async () => {
		await r.load('/preload-root');
		assert.equal(await r.text('h1'), 'root preload function ran: true');
	});

	it('cancels navigation if subsequent navigation occurs during preload', async () => {
		await r.load('/');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('a[href="slow-preload"]');
		await r.wait();
		await r.page.click('a[href="foo"]');

		assert.equal(r.page.url(), `${r.base}/foo`);
		assert.equal(await r.text('h1'), 'foo');

		await r.page.evaluate(() => fulfil());
		await r.wait();
		assert.equal(r.page.url(), `${r.base}/foo`);
		assert.equal(await r.text('h1'), 'foo');
	});

	it('navigates to prefetched urls', async () => {
		await r.load('/');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.hover('a[href="prefetch/qwe"]');
		await r.wait(50);
		await r.page.hover('a[href="prefetch/xyz"]');
		await r.wait(50);

		await r.page.click('a[href="prefetch/qwe"]');
		await r.wait();

		assert.equal(
			await r.text('h1'),
			'qwe'
		);

		await r.load('/prefetch');

		assert.equal(
			await r.text('h1'),
			'prefetch'
		);
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});

	it('re-runs preload when page.query changes', async () => {
		await r.load('/echo?foo=1');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		assert.equal(
			await r.text('pre'),
			`{"foo":"1"}`
		);

		await r.page.click('a[href="echo?foo=2"]');
		await r.wait();

		assert.equal(
			await r.text('pre'),
			`{"foo":"2"}`
		);
	});
});
