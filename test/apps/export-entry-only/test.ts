import * as assert from 'assert';
import { walk } from '../../utils';
import * as api from '../../../api';

describe('export entrypoints only', function () {
	this.timeout(10000);

	// hooks
	before('build app', () => api.build({ cwd: __dirname }));
	before('export app', () => api.export({ cwd: __dirname, entry: '/index.html blog about.html', entry_only: true }));

	// tests
	it('does not crawl site when given entry_only option, only entry points', () => {
		const files = walk(`${__dirname}/__sapper__/export`);

		const client_assets = files.filter(file => file.startsWith('client/'));
		const non_client_assets = files.filter(file => !file.startsWith('client/')).sort();

		assert.ok(client_assets.length > 0);

		assert.deepStrictEqual(non_client_assets.sort(), [
			'blog.json',
			'blog/index.html',
			'global.css',
			'index.html',
			'about/index.html',
			'service-worker-index.html',
			'service-worker.js'
		].sort());
	});

});
