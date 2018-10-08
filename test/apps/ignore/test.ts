import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('ignore', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page } = await runner.start());
	});

	after(() => runner.end());

	it('respects `options.ignore` values (RegExp)', async () => {
		await page.goto(`${base}/foobar`);

		assert.equal(
			await page.evaluate(() => document.documentElement.textContent),
			'foobar'
		);
	});

	it('respects `options.ignore` values (String #1)', async () => {
		await page.goto(`${base}/buzz`);

		assert.equal(
			await page.evaluate(() => document.documentElement.textContent),
			'buzz'
		);
	});

	it('respects `options.ignore` values (String #2)', async () => {
		await page.goto(`${base}/fizzer`);

		assert.equal(
			await page.evaluate(() => document.documentElement.textContent),
			'fizzer'
		);
	});

	it('respects `options.ignore` values (Function)', async () => {
		await page.goto(`${base}/hello`);

		assert.equal(
			await page.evaluate(() => document.documentElement.textContent),
			'hello'
		);
	});
});