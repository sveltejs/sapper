import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('scroll', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('scrolls to active deeplink', async () => {
		await r.load('/tall-page#foo');
		await r.sapper.start();

		const scrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0, String(scrollY));
	});

	it('scrolls to any deeplink if it was already active', async () => {
		await r.load('/tall-page#foo');
		await r.sapper.start();

		let scrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0, String(scrollY));

		scrollY = await r.page.evaluate(() => {
			window.scrollTo(0, 0);
			return window.scrollY;
		});
		assert.ok(scrollY === 0, String(scrollY));

		await r.page.click('[href="tall-page#foo"]');
		scrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0, String(scrollY));
	});

	it('resets scroll when a link is clicked', async () => {
		await r.load('/tall-page#foo');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="another-tall-page"]');
		await r.wait();

		assert.strictEqual(await r.page.evaluate(() => window.scrollY), 0);
	});

	it('preserves scroll when a link with sapper:noscroll is clicked', async () => {
		await r.load('/tall-page#foo');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="another-tall-page"][sapper\\:noscroll]');
		await r.wait();

		const scrollY = await r.page.evaluate(() => window.scrollY);

		assert.ok(scrollY > 0);
	});

	it('scrolls into a deeplink on a new page', async () => {
		await r.load('/tall-page#foo');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="another-tall-page#bar"]');
		await r.wait();
		assert.strictEqual(await r.text('h1'), 'Another tall page');
		const scrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0);
	});

	it('scrolls to a deeplink on a new page no matter the previous scroll position', async () => {
		await r.load('/a-third-tall-page#top');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('a#top');
		await r.wait();
		const firstScrollY = await r.page.evaluate(() => window.scrollY);

		await r.load('/a-third-tall-page#bottom');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('a#bottom');
		await r.wait();
		const secondScrollY = await r.page.evaluate(() => window.scrollY);

		assert.strictEqual(firstScrollY, secondScrollY);
	});

	it('restores scroll on popstate events', async () => {
		await r.load('/search-page#end');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		assert.strictEqual(await r.text('h1'), 'A search form');

		const firstScrollY = await r.page.evaluate(() => window.scrollY);

		assert.ok(firstScrollY > 0, String(firstScrollY));

		await r.page.click('button#navigate');

		const newScrollY = await r.page.evaluate(() => window.scrollY);

		assert.ok(newScrollY === 0);

		await r.page.goBack();

		const secondScrollY = await r.page.evaluate(() => window.scrollY);

		assert.strictEqual(firstScrollY, secondScrollY);
	});

	it('restores scroll on popstate events preceded by search param changes', async () => {
		await r.load('/search-page#search');
		await r.sapper.start();

		assert.strictEqual(await r.text('h1'), 'A search form');

		// We're at the search button, ~9999px down the page
		const initialScrollY = await r.page.evaluate(() => window.scrollY);

		assert.ok(
			initialScrollY > 9999,
			`Scroll pos when loading page for the first time: ${String(initialScrollY)}`
		);

		// Applies search params (but keep same pathname)
		await r.page.click('button#submit-search');

		// Now we're scrolled back at the top, at 0px, same page but with search params
		const newScrollY = await r.page.evaluate(() => window.scrollY);

		assert.ok(newScrollY === 0, 'Scroll pos after updating search params');

		// Scroll down to the 'end' div, near the bottom of the page
		await r.page.evaluate(() => document.querySelector('#end').scrollIntoView());
		const beforeClickScrollY = await r.page.evaluate(() => window.scrollY);

		assert.ok(
			beforeClickScrollY > 14000,
			`Scroll pos before navigating away from the page: ${String(beforeClickScrollY)}`
		);

		// Go to a new page
		await r.page.click('button#navigate');

		// Go back (popstate)
		await r.page.goBack();

		const finalScrollY = await r.page.evaluate(() => window.scrollY);

		assert.strictEqual(
			finalScrollY,
			beforeClickScrollY
		);
	});

	it('scrolls to the top when navigating with goto', async () => {
		await r.load('/search-form#search');
		await r.sapper.start();

		const initialScrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(initialScrollY > 0, String(initialScrollY));

		await r.page.click('button#scroll');

		const scrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(scrollY === 0, String(scrollY));
	});

	it('preserves scroll when noscroll: true is passed to goto', async () => {
		await r.load('/search-form#search');
		await r.sapper.start();

		const initialScrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(initialScrollY > 0, String(initialScrollY));

		await r.page.click('button#preserve');

		const scrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(scrollY === initialScrollY, String(scrollY));
	});

	it('scrolls to the top after redirecting', async () => {
		await r.load('/tall-page#foo');
		await r.sapper.start();

		await r.page.click('[href="redirect"]');
		await r.wait();

		const scrollY = await r.page.evaluate(() => window.scrollY);

		assert.ok(scrollY === 0);
	});

	it('survives the tests with no server errors', () => {
		assert.deepStrictEqual(r.errors, []);
	});
});
