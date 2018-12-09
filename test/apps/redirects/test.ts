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
	let title: () => Promise<string>;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page, start, prefetchRoutes, title } = await runner.start({
			requestInterceptor: (interceptedRequest) => {
				if (/example\.com/.test(interceptedRequest.url())) {
					interceptedRequest.respond({
						status: 200,
						contentType: 'text/html',
						body: `<h1>external</h1>`
					});
				} else {
					interceptedRequest.continue();
				}
			}
		}));
	});

	after(() => runner.end());

	it('redirects on server', async () => {
		await page.goto(`${base}/redirect-from`);

		assert.equal(
			page.url(),
			`${base}/redirect-to`
		);

		assert.equal(
			await title(),
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
			await title(),
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
			await title(),
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
			await title(),
			'root'
		);
	});

	it('redirects to external URL on server', async () => {
		await page.goto(`${base}/redirect-to-external`);

		assert.equal(
			page.url(),
			`https://example.com/`
		);

		assert.equal(
			await title(),
			'external'
		);
	});

	it('redirects to external URL in client', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('[href="redirect-to-external"]');
		await wait(50);

		assert.equal(
			page.url(),
			`https://example.com/`
		);

		assert.equal(
			await title(),
			'external'
		);
	});
});