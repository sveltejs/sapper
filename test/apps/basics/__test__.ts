import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import * as http from 'http';
import { build } from '../../../api';
import { AppRunner } from '../../utils';

declare const start: () => Promise<void>;
declare const prefetchRoutes: () => Promise<void>;
declare const prefetch: (href: string) => Promise<void>;
declare const goto: (href: string) => Promise<void>;

declare let deleted: { id: number };
declare let el: any;

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

	const title = () => page.$eval('h1', node => node.textContent);

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
			await title(),
			'Great success!'
		);
	});

	it('serves /?', async () => {
		await page.goto(`${base}?`);

		assert.equal(
			await title(),
			'Great success!'
		);
	});

	it('serves static route', async () => {
		await page.goto(`${base}/a`);

		assert.equal(
			await title(),
			'a'
		);
	});

	it('serves static route from dir/index.html file', async () => {
		await page.goto(`${base}/b`);

		assert.equal(
			await title(),
			'b'
		);
	});

	it('serves dynamic route', async () => {
		await page.goto(`${base}/test-slug`);

		assert.equal(
			await title(),
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
			await title(),
			'a'
		);
	});

	it('navigates programmatically', async () => {
		await page.goto(`${base}/a`);
		await _start();

		await _goto('b');

		assert.equal(
			await title(),
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


	// TODO equivalent test for a webpack app
	it('sets Content-Type, Link...modulepreload, and Cache-Control headers', () => {
		return new Promise((fulfil, reject) => {
			const req = http.get(base, res => {
				try {
					const { headers } = res;

					assert.equal(
						headers['content-type'],
						'text/html'
					);

					assert.equal(
						headers['cache-control'],
						'max-age=600'
					);

					// TODO preload more than just the entry point
					const regex = /<\/client\/client\.\w+\.js>;rel="modulepreload"/;
					const link = <string>headers['link'];

					assert.ok(regex.test(link), link);

					fulfil();
				} catch (err) {
					reject(err);
				}
			});

			req.on('error', reject);
		});
	});

	it('calls a delete handler', async () => {
		await page.goto(`${base}/delete-test`);
		await _start();

		await page.click('.del');
		await page.waitForFunction(() => deleted);

		assert.equal(await page.evaluate(() => deleted.id), 42);
	});

	it('hydrates initial route', async () => {
		await page.goto(base);

		await page.evaluate(() => {
			el = document.querySelector('.hydrate-test');
		});

		await _start();

		assert.ok(await page.evaluate(() => {
			return document.querySelector('.hydrate-test') === el;
		}));
	});

	it('does not attempt client-side navigation to server routes', async () => {
		await page.goto(base);
		await _start();
		await _prefetchRoutes();

		await page.click(`[href="ambiguous/ok.json"]`);

		assert.equal(
			await page.evaluate(() => document.body.textContent),
			'ok'
		);
	});

	it('allows reserved words as route names', async () => {
		await page.goto(`${base}/const`);
		await _start();

		assert.equal(
			await title(),
			'reserved words are okay as routes'
		);
	});

	it('accepts value-less query string parameter on server', async () => {
		await page.goto(`${base}/echo-query?message`);

		assert.equal(
			await title(),
			'message: ""'
		);
	});

	it('accepts value-less query string parameter on client', async () => {
		await page.goto(base);
		await _start();
		await _prefetchRoutes();

		await page.click('a[href="echo-query?message"]')

		assert.equal(
			await title(),
			'message: ""'
		);
	});

	// skipped because Nightmare doesn't seem to focus the <a> correctly
	it('resets the active element after navigation', async () => {
		await page.goto(base);
		await _start();
		await _prefetchRoutes();

		await page.click('[href="a"]');

		assert.equal(
			await page.evaluate(() => document.activeElement.nodeName),
			'BODY'
		);
	});

	it('replaces %sapper.xxx% tags safely', async () => {
		await page.goto(`${base}/unsafe-replacement`);
		await _start();

		const html = await page.evaluate(() => document.body.innerHTML);
		assert.equal(html.indexOf('%sapper'), -1);
	});
});