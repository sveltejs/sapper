import * as assert from 'assert';
import { walk } from '../../utils';
import * as api from '../../../api';

describe('export no crawl', function () {
	this.timeout(10000);

	// hooks
	before('build app', () => api.build({ cwd: __dirname }));
	before('export app', () => api.export({ cwd: __dirname, entry: 'about', no_crawl: true }));

	// tests
	it('does not crawl a site when instructed not to', () => {
		const files = walk(`${__dirname}/__sapper__/export`);

		const client_assets = files.filter(file => file.startsWith('client/'));
		const non_client_assets = files.filter(file => !file.startsWith('client/')).sort();

		assert.ok(client_assets.length > 0);

		assert.deepEqual(non_client_assets.sort(), [
			'global.css',
			'about/index.html',
			'service-worker-index.html',
			'service-worker.js'
		].sort());
	});

});
