import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('css', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('includes critical CSS with server render', async () => {
		await r.load('/');

		assert.strictEqual(
			await r.page.$eval('h1', node => getComputedStyle(node).color),
			'rgb(255, 0, 0)'
		);
	});

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

	it('includes CSS on error page', async () => {
		await r.load('/doesnotexist');

		assert.strictEqual(
			await r.page.$eval('h1', node => getComputedStyle(node).color),
			'rgb(128, 0, 128)'
		);
	});

	// note that we're specifically testing another route here and not just a component
	it('includes CSS from imported route', async () => {
		await r.load('/index2');
		assert.strictEqual(
			await r.page.$eval('h1', node => getComputedStyle(node).color),
			'rgb(255, 0, 0)'
		);
	});

	it('loads CSS when navigating client-side', async () => {
		await r.load('/');

		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="foo"]');
		await r.wait();

		assert.strictEqual(
			await r.page.$eval('h1', node => getComputedStyle(node).color),
			'rgb(0, 0, 255)'
		);
	});

	it('loads CSS for a lazily-rendered component', async () => {
		await r.load('/');

		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="bar"]');
		await r.wait();

		assert.strictEqual(
			await r.page.$eval('h1', node => getComputedStyle(node).color),
			'rgb(0, 128, 0)'
		);
	});

	it('survives the tests with no server errors', () => {
		assert.deepStrictEqual(r.errors, []);
	});
});
