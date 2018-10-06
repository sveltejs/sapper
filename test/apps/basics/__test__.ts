import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../../utils';

describe.only('basics', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let browser: puppeteer.Browser;
	let page: puppeteer.Page;
	let base: string;

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
					browser = await puppeteer.launch();

					fulfil();
				} catch (err) {
					reject(err);
				}
			});
		});
	});

	beforeEach(async () => {
		page = await browser.newPage();
	});

	after(async () => {
		await browser.close();
		await runner.end();
	});

	it('serves /', async () => {
		await page.goto(base);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'Great success!'
		);
	});

	it('serves /?', async () => {
		await page.goto(`${base}?`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'Great success!'
		);
	});

	it('serves static route', async () => {
		await page.goto(`${base}/a`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'a'
		);
	});

	it('serves static route from dir/index.html file', async () => {
		await page.goto(`${base}/b`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'b'
		);
	});

	it('serves dynamic route', async () => {
		await page.goto(`${base}/test-slug`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'TEST-SLUG'
		);
	});
});