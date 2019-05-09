import * as assert from 'assert';
import * as api from '../../../api';
import { walk } from '../../utils';
import { AppRunner } from '../AppRunner';

describe('with-basepath', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => api.build({ cwd: __dirname }));
	before('export app', () => api.export({ cwd: __dirname, basepath: '/custom-basepath' }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('serves /custom-basepath', async () => {
		await r.load('/custom-basepath');

		assert.equal(
			await r.text('h1'),
			'Great success!'
		);
	});

	it('emits a basepath message', async () => {
		await r.load('/custom-basepath');

		assert.deepEqual(r.messages, [{
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
			'custom-basepath/redirect-to/index.html',
			'custom-basepath/service-worker-index.html',
			'custom-basepath/service-worker.js'
		]);
	});

	it('redirects on server', async () => {
		await r.load('/custom-basepath/redirect-from');

		assert.equal(
			r.page.url(),
			`${r.base}/custom-basepath/redirect-to`
		);

		assert.equal(
			await r.text('h1'),
			'redirected'
		);
	});

	it('redirects in client', async () => {
		await r.load('/custom-basepath');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('[href="redirect-from"]');
		await r.wait();

		assert.equal(
			r.page.url(),
			`${r.base}/custom-basepath/redirect-to`
		);

		assert.equal(
			await r.text('h1'),
			'redirected'
		);
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
