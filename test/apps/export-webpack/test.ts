import * as assert from 'assert';
import * as api from '../../../api';
import * as fs from 'fs';

describe('export-webpack', function() {
	this.timeout(10000);

	// hooks
	before('build app', () => api.build({ cwd: __dirname, bundler: 'webpack' }));
	before('export app', () => api.export({ cwd: __dirname }));

	// tests
	it('injects <link rel=preload> tags', () => {
		const index = fs.readFileSync(`${__dirname}/__sapper__/export/index.html`, 'utf8');
		assert.ok(/rel=preload/.test(index));
	});
});
