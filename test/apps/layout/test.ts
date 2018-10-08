import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';

describe('layout', function() {
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

	it('only recreates components when necessary', async () => {
		await page.goto(`${base}/foo/bar/baz`);
		await start();

		const text1 = await page.evaluate(() => document.querySelector('#sapper').textContent);
		assert.deepEqual(text1.split('\n').filter(Boolean), [
			'y: bar 1',
			'z: baz 1',
			'click me',
			'child segment: baz'
		]);

		await page.click('[href="foo/bar/qux"]');
		await wait(50);

		const text2 = await page.evaluate(() => document.querySelector('#sapper').textContent);
		assert.deepEqual(text2.split('\n').filter(Boolean), [
			'y: bar 1',
			'z: qux 2',
			'click me',
			'child segment: qux'
		]);
	});
});