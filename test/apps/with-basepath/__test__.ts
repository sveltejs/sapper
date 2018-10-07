import * as path from 'path';
import * as assert from 'assert';
import * as puppeteer from 'puppeteer';
import * as api from '../../../api';
import { walk } from '../../utils';
import { AppRunner } from '../AppRunner';

describe('with-basepath', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// hooks
	before(() => {
		return new Promise((fulfil, reject) => {
			// TODO this is brittle. Make it unnecessary
			process.chdir(__dirname);
			process.env.NODE_ENV = 'production';

			// TODO this API isn't great. Rethink it
			const builder = api.build({
				bundler: 'rollup'
			}, {
				src: path.join(__dirname, 'src'),
				routes: path.join(__dirname, 'src/routes'),
				dest: path.join(__dirname, '__sapper__/build')
			});

			builder.on('error', reject);
			builder.on('done', () => {
				// TODO it'd be nice if build and export returned promises.
				// not sure how best to combine promise and event emitter
				const exporter = api.exporter({
					build: '__sapper__/build',
					dest: '__sapper__/export',
					static: 'static',
					basepath: 'custom-basepath',
					timeout: 5000
				});

				exporter.on('error', (err: Error) => {
					console.error(err);
					reject(err);
				});

				exporter.on('done', async () => {
					try {
						runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
						({ base, page } = await runner.start());

						fulfil();
					} catch (err) {
						reject(err);
					}
				});
			});
		});
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
		const files = walk('__sapper__/export');

		const client_assets = files.filter(file => file.startsWith('custom-basepath/client/'));
		const non_client_assets = files.filter(file => !file.startsWith('custom-basepath/client/')).sort();

		assert.ok(client_assets.length > 0);

		assert.deepEqual(non_client_assets, [
			'custom-basepath/global.css',
			'custom-basepath/index.html',
			'custom-basepath/service-worker.js'
		]);
	});
});