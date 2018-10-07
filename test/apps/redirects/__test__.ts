import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';

describe('redirects', function() {
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

	it('redirects on server', async () => {
		await page.goto(`${base}/redirect-from`);

		assert.equal(
			page.url(),
			`${base}/redirect-to`
		);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'redirected'
		);
	});

	it('redirects in client', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('[href="redirect-from"]');
		await wait(50);

		assert.equal(
			page.url(),
			`${base}/redirect-to`
		);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'redirected'
		);
	});

	it('redirects to root on server', async () => {
		await page.goto(`${base}/redirect-to-root`);

		assert.equal(
			page.url(),
			`${base}/`
		);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'root'
		);
	});

	it('redirects to root in client', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('[href="redirect-to-root"]');
		await wait(50);

		assert.equal(
			page.url(),
			`${base}/`
		);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'root'
		);
	});
});