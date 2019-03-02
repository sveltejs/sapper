import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import * as api from '../../../api';
import { walk } from '../../utils';
import { AppRunner } from '../AppRunner';
import { wait } from '../../utils';


describe('with-basepath', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	let start: () => Promise<void>;
	let prefetchRoutes: () => Promise<void>;
	let title: () => Promise<string>;

	// hooks
	before(async () => {
		await api.build({ cwd: __dirname });

		await api.export({
			cwd: __dirname,
			basepath: '/custom-basepath'
		});

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, start, page, prefetchRoutes, title } = await runner.start());
	});

	after(() => runner.end());

	it('serves /custom-basepath', async () => {
		await page.goto(`${base}/custom-basepath`);

		assert.equal(
			await page.$eval('h1', node => node.textContent),
			'Great success!'
		);
	});

	it('emits a basepath message', async () => {
		await page.goto(`${base}/custom-basepath`);

		assert.deepEqual(runner.messages, [{
			__sapper__: true,
			event: 'basepath',
			basepath: '/custom-basepath'
		}]);
	});

	it('crawls an exported site with basepath', () => {
		const files = walk(`${__dirname}/__sapper__/export`);

		const client_assets = files.filter(file => file.startsWith('custom-basepath/client/'));
		const non_client_assets = files.filter(file => !file.startsWith('custom-basepath/client/')).sort();

		assert.ok(client_assets.length > 0);

		assert.deepEqual(non_client_assets, [
			'custom-basepath/global.css',
			'custom-basepath/index.html',
			'custom-basepath/redirect-from/index.html',
			'custom-basepath/redirect-to',
			'custom-basepath/service-worker-index.html',
			'custom-basepath/service-worker.js'
		]);
	});

	it('redirects on server', async () => {
		console.log('base', base)
		await page.goto(`${base}/custom-basepath/redirect-from`);

		assert.equal(
			page.url(),
			`${base}/custom-basepath/redirect-to`
		);

		assert.equal(
			await title(),
			'redirected'
		);
	});

	it('redirects in client', async () => {
		await page.goto(`${base}/custom-basepath`);
		await start();
		await prefetchRoutes();

		await page.click('[href="redirect-from"]');
		await wait(50);

		assert.equal(
			page.url(),
			`${base}/custom-basepath/redirect-to`
		);

		assert.equal(
			await title(),
			'redirected'
		);
	});
});