import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('session', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// helpers
	let start: () => Promise<void>;
	let title: () => Promise<string>;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page, start, title } = await runner.start());
	});

	after(() => runner.end());

	it('renders session props', async () => {
		await page.goto(`${base}/session`);

		assert.equal(await title(), 'hello world');

		await start();
		assert.equal(await title(), 'hello world');

		await page.click('button');
		assert.equal(await title(), 'changed');
	});

	it('preloads session props', async () => {
		await page.goto(`${base}/preloaded`);

		assert.equal(await title(), 'hello world');

		await start();
		assert.equal(await title(), 'hello world');

		await page.click('button');
		assert.equal(await title(), 'changed');
	});
});