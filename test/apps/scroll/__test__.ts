import * as assert from 'assert';
import * as path from 'path';
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
		({ base, page, start, prefetchRoutes } = await runner.start());
	});

	after(() => runner.end());

	it('scrolls to active deeplink', async () => {
		await page.goto(`${base}/tall-page#foo`);
		await start();

		const scrollY = await page.evaluate(() => window.scrollY);
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
});