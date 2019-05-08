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
			window.scrollTo(0, 0)
			return window.scrollY
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

		assert.equal(
			await r.page.evaluate(() => window.scrollY),
			0
		);
	});

	it('preserves scroll when a link with sapper-noscroll is clicked', async () => {
		await r.load('/tall-page#foo');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="another-tall-page"][sapper-noscroll]');
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
		assert.equal(await r.text('h1'), 'Another tall page');
		const scrollY = await r.page.evaluate(() => window.scrollY);
		assert.ok(scrollY > 0);
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
