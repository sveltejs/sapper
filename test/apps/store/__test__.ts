import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../../utils';

declare const start: () => Promise<void>;
declare const prefetchRoutes: () => Promise<void>;
declare const prefetch: (href: string) => Promise<void>;
declare const goto: (href: string) => Promise<void>;

describe('store', function() {
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

	const title = () => page.$eval('h1', node => node.textContent);

	it('renders store props', async () => {
		await page.goto(`${base}/store`);

		assert.equal(await title(), 'hello world');

		await _start();
		assert.equal(await title(), 'hello world');
	});
});