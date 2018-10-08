import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { wait } from '../../utils';
import { AppRunner } from '../AppRunner';

describe('credentials', function() {
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

	it('sends cookies when using this.fetch with credentials: "include"', async () => {
		await page.goto(`${base}/credentials?creds=include`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'a: 1, b: 2, max-age: undefined'
		);
	});

	it('does not send cookies when using this.fetch without credentials', async () => {
		await page.goto(`${base}/credentials`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'unauthorized'
		);
	});

	it('delegates to fetch on the client', async () => {
		await page.goto(base)
		await start();
		await prefetchRoutes();

		await page.click('[href="credentials?creds=include"]');
		await wait(50);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'a: 1, b: 2, max-age: undefined'
		);
	});
});