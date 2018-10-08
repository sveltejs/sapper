import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('store', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// helpers
	let start: () => Promise<void>;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page, start } = await runner.start());
	});

	after(() => runner.end());

	const title = () => page.$eval('h1', node => node.textContent);

	it('renders store props', async () => {
		await page.goto(`${base}/store`);

		assert.equal(await title(), 'hello world');

		await start();
		assert.equal(await title(), 'hello world');
	});
});