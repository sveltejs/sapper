import * as path from 'path';
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
		// TODO this is brittle. Make it unnecessary
		process.chdir(__dirname);
		process.env.NODE_ENV = 'production';

		// TODO this API isn't great. Rethink it
		await build({
			bundler: 'rollup'
		}, {
			src: path.join(__dirname, 'src'),
			routes: path.join(__dirname, 'src/routes'),
			dest: path.join(__dirname, '__sapper__/build')
		});

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