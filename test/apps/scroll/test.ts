import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';

describe('scroll', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// helpers
	let start: () => Promise<void>;
	let prefetchRoutes: () => Promise<void>;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page, start, prefetchRoutes } = await runner.start());
	});

	after(() => runner.end());

	it('scrolls to active deeplink', async () => {
		await page.goto(`${base}/tall-page#foo`);
		await start();

		const scrollY = await page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0, scrollY);
	});

	it('scrolls to any deeplink if it was already active', async () => {
		await page.goto(`${base}/tall-page#foo`);
		await start();

		let scrollY = await page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0, scrollY);

		scrollY = await page.evaluate(() => {
			window.scrollTo(0, 0)
			return window.scrollY
		});
		assert.ok(scrollY === 0, scrollY);

		await page.click('[href="tall-page#foo"]');
		scrollY = await page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0, scrollY);
	});

	it('resets scroll when a link is clicked', async () => {
		await page.goto(`${base}/tall-page#foo`);
		await start();
		await prefetchRoutes();

		await page.click('[href="another-tall-page"]');
		await wait(50);

		assert.equal(
			await page.evaluate(() => window.scrollY),
			0
		);
	});

	it('preserves scroll when a link with sapper-noscroll is clicked', async () => {
		await page.goto(`${base}/tall-page#foo`);
		await start();
		await prefetchRoutes();

		await page.click('[href="another-tall-page"][sapper-noscroll]');
		await wait(50);

		const scrollY = await page.evaluate(() => window.scrollY);

		assert.ok(scrollY > 0);
	});

	it('scrolls into a deeplink on a new page', async () => {
		await page.goto(`${base}/tall-page#foo`);
		await start();
		await prefetchRoutes();

		await page.click('[href="another-tall-page#bar"]');
		await wait(50);
		const scrollY = await page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0);
	});
});