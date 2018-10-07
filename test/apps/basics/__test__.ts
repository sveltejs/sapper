import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../../utils';

declare const start: () => Promise<void>;
declare const prefetchRoutes: () => Promise<void>;
declare const prefetch: (href: string) => Promise<void>;
declare const goto: (href: string) => Promise<void>;

describe('basics', function() {
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

	it('serves /', async () => {
		await page.goto(base);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'Great success!'
		);
	});

	it('serves /?', async () => {
		await page.goto(`${base}?`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'Great success!'
		);
	});

	it('serves static route', async () => {
		await page.goto(`${base}/a`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'a'
		);
	});

	it('serves static route from dir/index.html file', async () => {
		await page.goto(`${base}/b`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'b'
		);
	});

	it('serves dynamic route', async () => {
		await page.goto(`${base}/test-slug`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'TEST-SLUG'
		);
	});

	it('navigates to a new page without reloading', async () => {
		await page.goto(base);
		await _start();
		await _prefetchRoutes();

		const requests: string[] = await capture(async () => {
			await page.click('a[href="a"]');
		});

		assert.deepEqual(requests, []);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'a'
		);
	});

	it('navigates programmatically', async () => {
		await page.goto(`${base}/a`);
		await _start();

		await _goto('b');

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'b'
		);
	});

	it('prefetches programmatically', async () => {
		await page.goto(`${base}/a`);
		await _start();

		const requests = await capture(() => _prefetch('b'));

		assert.equal(requests.length, 2);
		assert.equal(requests[1], `${base}/b.json`);
	});

	// it('cancels navigation if subsequent navigation occurs during preload', () => {
	// 	return nightmare
	// 		.goto(base)
	// 		.init()
	// 		.click('a[href="slow-preload"]')
	// 		.wait(100)
	// 		.click('a[href="about"]')
	// 		.wait(100)
	// 		.then(() => nightmare.path())
	// 		.then(path => {
	// 			assert.equal(path, `${basepath}/about`);
	// 			return nightmare.title();
	// 		})
	// 		.then(title => {
	// 			assert.equal(title, 'About');
	// 			return nightmare.evaluate(() => window.fulfil({})).wait(100);
	// 		})
	// 		.then(() => nightmare.path())
	// 		.then(path => {
	// 			assert.equal(path, `${basepath}/about`);
	// 			return nightmare.title();
	// 		})
	// 		.then(title => {
	// 			assert.equal(title, 'About');
	// 		});
	// });
});