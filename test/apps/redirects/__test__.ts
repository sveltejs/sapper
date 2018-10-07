import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../../utils';

declare const start: () => Promise<void>;
declare const prefetchRoutes: () => Promise<void>;

describe('redirects', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let browser: puppeteer.Browser;
	let page: puppeteer.Page;
	let base: string;

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
					await runner.start();

					base = `http://localhost:${runner.port}`;
					browser = await puppeteer.launch({ args: ['--no-sandbox'] });

					fulfil();
				} catch (err) {
					reject(err);
				}
			});
		});
	});

	beforeEach(async () => {
		page = await browser.newPage();
		page.on('console', msg => {
			console.log(msg.text());
		});
	});

	after(async () => {
		await browser.close();
		await runner.end();
	});

	// helpers
	const _start = () => page.evaluate(() => start());
	const _prefetchRoutes = () => page.evaluate(() => prefetchRoutes());

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
		await _start();
		await _prefetchRoutes();

		await page.click('[href="redirect-from"]');

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
		await _start();
		await _prefetchRoutes();

		await page.click('[href="redirect-to-root"]');

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