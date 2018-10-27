import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';

describe('errors', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// helpers
	let start: () => Promise<void>;
	let prefetchRoutes: () => Promise<void>;
	let title: () => Promise<string>;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page, start, prefetchRoutes, title } = await runner.start());
	});

	after(() => runner.end());

	it('handles missing route on server', async () => {
		await page.goto(`${base}/nope`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'404'
		);
	});

	it('handles missing route on client', async () => {
		await page.goto(base);
		await start();

		await page.click('[href="nope"]');
		await wait(50);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'404'
		);
	});

	it('handles explicit 4xx on server', async () => {
		await page.goto(`${base}/blog/nope`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'404'
		);
	});

	it('handles explicit 4xx on client', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('[href="blog/nope"]');
		await wait(50);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'404'
		);
	});

	it('handles error on server', async () => {
		await page.goto(`${base}/throw`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'500'
		);
	});

	it('handles error on client', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('[href="throw"]');
		await wait(50);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'500'
		);
	});

	it('does not serve error page for explicit non-page errors', async () => {
		await page.goto(`${base}/nope.json`);

		assert.equal(
			await page.evaluate(() => document.body.textContent),
			'nope'
		);
	});

	it('does not serve error page for thrown non-page errors', async () => {
		await page.goto(`${base}/throw.json`);

		assert.equal(
			await page.evaluate(() => document.body.textContent),
			'oops'
		);
	});

	it('does not serve error page for async non-page error', async () => {
		await page.goto(`${base}/async-throw.json`);

		assert.equal(
			await page.evaluate(() => document.body.textContent),
			'oops'
		);
	});

	it('clears props.error on successful render', async () => {
		await page.goto(`${base}/no-error`);
		await start();
		await prefetchRoutes();

		await page.click('[href="enhance-your-calm"]');
		await wait(50);
		assert.equal(await title(), '420');

		await page.goBack();
		await wait(50);
		assert.equal(await title(), 'No error here');
	});
});