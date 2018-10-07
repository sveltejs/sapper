import * as path from 'path';
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

	// hooks
	before(() => {
		return new Promise((fulfil, reject) => {
			// TODO this is brittle. Make it unnecessary
			process.chdir(__dirname);
			process.env.NODE_ENV = 'production';

			// TODO this API isn't great. Rethink it
			const emitter = build({
				bundler: 'rollup'
			}, {
				src: path.join(__dirname, 'src'),
				routes: path.join(__dirname, 'src/routes'),
				dest: path.join(__dirname, '__sapper__/build')
			});

			emitter.on('error', reject);

			emitter.on('done', async () => {
				try {
					runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
					({ base, page, start, prefetchRoutes } = await runner.start());

					fulfil();
				} catch (err) {
					reject(err);
				}
			});
		});
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
});