import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';

describe('encoding', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// helpers
	let start: () => Promise<void>;
	let prefetchRoutes: () => Promise<void>;

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
					({ base, page, start, prefetchRoutes } = await runner.start());

					fulfil();
				} catch (err) {
					reject(err);
				}
			});
		});
	});

	after(() => runner.end());

	it('encodes routes', async () => {
		await page.goto(`${base}/fünke`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			`I'm afraid I just blue myself`
		);
	});

	it('encodes req.params and req.query for server-rendered pages', async () => {
		await page.goto(`${base}/echo/page/encöded?message=hëllö+wörld`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'encöded (hëllö wörld)'
		);
	});

	it('encodes req.params and req.query for client-rendered pages', async () => {
		await page.goto(base);
		await start();
		await prefetchRoutes();

		await page.click('a[href="echo/page/encöded?message=hëllö+wörld"]');
		await wait(50);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'encöded (hëllö wörld)'
		);
	});

	it('encodes req.params for server routes', async () => {
		await page.goto(`${base}/echo/server-route/encöded`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'encöded'
		);
	});
});