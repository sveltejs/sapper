import * as assert from 'assert';
import { walk } from '../../utils';
import * as api from '../../../api';

describe('export-no-subfolders', function () {
	this.timeout(10000);

	// hooks
	before('build app', () => api.build({ cwd: __dirname }));
	before('export app', () => api.export({ cwd: __dirname, subfolders: false }));

	// tests
	it('exports to ${path}.html instead of ${path}/index.html', () => {
		const files = walk(`${__dirname}/__sapper__/export`);

		const client_assets = files.filter(file => file.startsWith('client/'));
		const non_client_assets = files.filter(file => !file.startsWith('client/')).sort();

		assert.ok(client_assets.length > 0);

		const boom = ['boom.html'];
		for (let a = 1; a <= 20; a += 1) {
			boom.push(`boom/${a}.html`);
			for (let b = 1; b <= 20; b += 1) {
				boom.push(`boom/${a}/${b}.html`);
			}
		}

		assert.deepEqual(non_client_assets.sort(), [
			'blog.json',
			'blog/bar.json',
			'blog/bar.html',
			'blog/baz.json',
			'blog/baz.html',
			'blog/foo.json',
			'blog/foo.html',
			'blog.html',
			'global.css',
			'index.html',
			'manifest.json',
			'service-worker-index.html',
			'service-worker.js',
			'test.pdf',
			'img/example-192.png',
			'img/example-512.png',
			'pdfs/test.pdf',
			...boom
		].sort());
	});
});
