import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';

describe('css', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// helpers
	let start: () => Promise<void>;
	let prefetchRoutes: () => Promise<void>;
	let prefetch: (href: string) => Promise<void>;
	let goto: (href: string) => Promise<void>;
	let title: () => Promise<string>;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page, start, prefetchRoutes, prefetch, goto, title } = await runner.start());
	});

	after(() => runner.end());

	it('includes critical CSS with server render', async () => {
		await page.goto(base);

		assert.equal(
			await page.evaluate(() => {
				const h1 = document.querySelector('h1');
				return getComputedStyle(h1).color;
			}),
			'rgb(255, 0, 0)'
		);
	});

	it('loads CSS when navigating client-side', async () => {
		await page.goto(base);

		await start();
		await prefetchRoutes();

		await page.click(`[href="foo"]`);
		await wait(50);

		assert.equal(
			await page.evaluate(() => {
				const h1 = document.querySelector('h1');
				return getComputedStyle(h1).color;
			}),
			'rgb(0, 0, 255)'
		);
	});

	it('loads CSS for a lazily-rendered component', async () => {
		await page.goto(base);

		await start();
		await prefetchRoutes();

		await page.click(`[href="bar"]`);
		await wait(50);

		assert.equal(
			await page.evaluate(() => {
				const h1 = document.querySelector('h1');
				return getComputedStyle(h1).color;
			}),
			'rgb(0, 128, 0)'
		);
	});
});