import * as assert from 'assert';
import { walk } from '../../utils';
import * as api from '../../../api';

describe('export w/o serviceworker', function() {
	this.timeout(10000);

	// hooks
	before('build app', () => api.build({ cwd: __dirname }));
	before('export app', () => api.export({ cwd: __dirname }));

	// tests
	it('do not create service-worker-index.html', () => {
		const files = walk(`${__dirname}/__sapper__/export`);

		const client_assets = files.filter(file => file.startsWith('client/'));
		const non_client_assets = files.filter(file => !file.startsWith('client/')).sort();

		assert.ok(client_assets.length > 0);

		assert.deepStrictEqual(non_client_assets.sort(), [
			'global.css',
			'index.html'
		].sort());
	});
});
