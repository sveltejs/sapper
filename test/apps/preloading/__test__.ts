import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner, wait } from '../../utils';

declare const start: () => Promise<void>;
declare const prefetchRoutes: () => Promise<void>;
declare const prefetch: (href: string) => Promise<void>;
declare const goto: (href: string) => Promise<void>;

declare const fulfil: () => Promise<void>;

describe('preloading', function() {
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

					page = await browser.newPage();
					page.on('console', msg => {
						console.log(msg.text());
					});

					fulfil();
				} catch (err) {
					reject(err);
				}
			});
		});
	});

	after(async () => {
		await browser.close();
		await runner.end();
	});

	// helpers
	const _start = () => page.evaluate(() => start());
	const _prefetchRoutes = () => page.evaluate(() => prefetchRoutes());
	const _prefetch = (href: string) => page.evaluate((href: string) => prefetch(href), href);
	const _goto = (href: string) => page.evaluate((href: string) => goto(href), href);

	function capture(fn: () => any): Promise<string[]> {
		return new Promise((fulfil, reject) => {
			const requests: string[] = [];
			const pending: Set<string> = new Set();
			let done = false;

			function handle_request(request: puppeteer.Request) {
				const url = request.url();
				requests.push(url);
				pending.add(url);
			}

			function handle_requestfinished(request: puppeteer.Request) {
				const url = request.url();
				pending.delete(url);

				if (done && pending.size === 0) {
					cleanup();
					fulfil(requests);
				}
			}

			function handle_requestfailed(request: puppeteer.Request) {
				cleanup();
				reject(new Error(`failed to fetch ${request.url()}`))
			}

			function cleanup() {
				page.removeListener('request', handle_request);
				page.removeListener('requestfinished', handle_requestfinished);
				page.removeListener('requestfailed', handle_requestfailed);
			}

			page.on('request', handle_request);
			page.on('requestfinished', handle_requestfinished);
			page.on('requestfailed', handle_requestfailed);

			return Promise.resolve(fn()).then(() => {
				if (pending.size === 0) {
					cleanup();
					fulfil(requests);
				}

				done = true;
			});
		});

	}

	const title = () => page.$eval('h1', node => node.textContent);

	it('serializes Set objects returned from preload', async () => {
		await page.goto(`${base}/preload-values/set`);

		assert.equal(await title(), 'true');

		await _start();
		assert.equal(await title(), 'true');
	});

	it('bails on custom classes returned from preload', async () => {
		await page.goto(`${base}/preload-values/custom-class`);

		assert.equal(await title(), '42');

		await _start();
		assert.equal(await title(), '42');
	});

	it('sets preloading true when appropriate', async () => {
		await page.goto(base);
		await _start();
		await _prefetchRoutes();

		await page.click('a[href="slow-preload"]');

		assert.ok(await page.evaluate(() => !!document.querySelector('progress')));

		await page.evaluate(() => fulfil());
		assert.ok(await page.evaluate(() => !document.querySelector('progress')));
	});

	it('runs preload in root component', async () => {
		await page.goto(`${base}/preload-root`);
		assert.equal(await title(), 'root preload function ran: true');
	});

	it('cancels navigation if subsequent navigation occurs during preload', async () => {
		await page.goto(base);
		await _start();
		await _prefetchRoutes();

		await page.click('a[href="slow-preload"]');
		await wait(100);
		await page.click('a[href="foo"]');

		assert.equal(page.url(), `${base}/foo`);
		assert.equal(await title(), 'foo');

		await page.evaluate(() => fulfil());
		await wait(100);
		assert.equal(page.url(), `${base}/foo`);
		assert.equal(await title(), 'foo');
	});
});