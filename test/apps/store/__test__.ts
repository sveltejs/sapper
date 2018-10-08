import * as path from 'path';
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
		// TODO this is brittle. Make it unnecessary
		process.chdir(__dirname);
		process.env.NODE_ENV = 'production';

		// TODO this API isn't great. Rethink it
		await build({
			bundler: 'rollup'
		}, {
			src: path.join(__dirname, 'src'),
			routes: path.join(__dirname, 'src/routes'),
			dest: path.join(__dirname, '__sapper__/build')
		});

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