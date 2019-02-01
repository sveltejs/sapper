import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import * as http from 'http';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';

declare let deleted: { id: number };
declare let el: any;

describe('basics', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// helpers
	let start: () => Promise<void>;
	let prefetchRoutes: () => Promise<void>;
	let prefetch: (href: string) => Promise<void>;
	let goto: (href: string) => Promise<void>;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page, start, prefetchRoutes, prefetch, goto } = await runner.start());
	});

	after(() => runner.end());

	const title = () => page.$eval('h1', node => node.textContent);

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
		await start();
		await prefetchRoutes();

		const requests: string[] = await runner.capture(async () => {
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
		await start();

		await goto('b');

		assert.equal(
			await title(),
			'b'
		);
	});

	it('prefetches programmatically', async () => {
		await page.goto(`${base}/a`);
		await start();

		const requests = await runner.capture(() => prefetch('b'));

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
		await start();

		await page.click('.del');
		await page.waitForFunction(() => deleted);

		assert.equal(await page.evaluate(() => deleted.id), 42);
	});

	it('hydrates initial route', async () => {
		await page.goto(base);

		await page.evaluate(() => {
			el = document.querySelector('.hydrate-test');
		});

		await start();

		assert.ok(await page.evaluate(() => {
			return document.querySelector('.hydrate-test') === el;
		}));
	});

	it('does not attempt client-side navigation to server routes', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click(`[href="ambiguous/ok.json"]`);
		await wait(50);

		assert.equal(
			await page.evaluate(() => document.body.textContent),
			'ok'
		);
	});

	it('allows reserved words as route names', async () => {
		await page.goto(`${base}/const`);
		await start();

		assert.equal(
			await title(),
			'reserved words are okay as routes'
		);
	});

	it('accepts value-less query string parameter on server', async () => {
		await page.goto(`${base}/echo-query?message`);

		assert.equal(
			await title(),
			'{"message":""}'
		);
	});

	it('accepts value-less query string parameter on client', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('a[href="echo-query?message"]')

		assert.equal(
			await title(),
			'{"message":""}'
		);
	});

	it('accepts duplicated query string parameter on server', async () => {
		await page.goto(`${base}/echo-query?p=one&p=two`);

		assert.equal(
			await title(),
			'{"p":["one","two"]}'
		);
	});

	it('accepts duplicated query string parameter on client', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('a[href="echo-query?p=one&p=two"]')

		assert.equal(
			await title(),
			'{"p":["one","two"]}'
		);
	});

	// skipped because Nightmare doesn't seem to focus the <a> correctly
	it('resets the active element after navigation', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('[href="a"]');
		await wait(50);

		assert.equal(
			await page.evaluate(() => document.activeElement.nodeName),
			'BODY'
		);
	});

	it('replaces %sapper.xxx% tags safely', async () => {
		await page.goto(`${base}/unsafe-replacement`);
		await start();

		const html = await page.evaluate(() => document.body.innerHTML);
		assert.equal(html.indexOf('%sapper'), -1);
	});
});