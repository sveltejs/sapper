import * as assert from 'assert';
import { walk } from '../../utils';
import * as api from '../../../api';
import { readFileSync } from 'fs'

// // SWYX: this fails right now because i was unable to merge https://github.com/nealalpert/sapper/blob/export-filter-urls/src/api/export.ts
// // TODO: neal look at this please
// describe('export filter', function() {
// 	this.timeout(10000);

// 	// hooks
// 	before('build app', () => api.build({ cwd: __dirname }));
// 	before('export app', () => api.export({ cwd: __dirname, filter: '^blog$ ^blog/foo* blog/bar' }));

// 	// tests
// 	it('crawls all blog, blog/foo and blog/bar pages', () => {
// 		const files = walk(`${__dirname}/__sapper__/export`);

// 		const client_assets = files.filter(file => file.startsWith('client/'));
// 		const non_client_assets = files.filter(file => !file.startsWith('client/')).sort();

// 		assert.ok(client_assets.length > 0);

// 		assert.deepEqual(non_client_assets.sort(), [
// 			'blog.json',
// 			'blog/bar.json',
// 			'blog/bar/index.html',
// 			'blog/foo.json',
// 			'blog/foo/index.html',
// 			'blog/index.html',
// 			'global.css',
// 			'index.html',
// 			'service-worker-index.html',
// 			'service-worker.js',
// 			'test.pdf'
// 		].sort());
// 	});
// });
