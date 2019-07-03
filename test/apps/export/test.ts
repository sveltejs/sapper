import * as assert from 'assert';
import { walk } from '../../utils';
import * as api from '../../../api';
import { readFileSync } from 'fs'

describe('export', function() {
	this.timeout(10000);

	// hooks
	before('build app', () => api.build({ cwd: __dirname }));
	before('export app', () => api.export({ cwd: __dirname }));

	// tests
	it('crawls a site', () => {
		const files = walk(`${__dirname}/__sapper__/export`);

		const client_assets = files.filter(file => file.startsWith('client/'));
		const non_client_assets = files.filter(file => !file.startsWith('client/')).sort();

		assert.ok(client_assets.length > 0);

		const boom = ['boom/index.html'];
		for (let a = 1; a <= 20; a += 1) {
			boom.push(`boom/${a}/index.html`);
			for (let b = 1; b <= 20; b += 1) {
				boom.push(`boom/${a}/${b}/index.html`);
			}
		}

		assert.deepEqual(non_client_assets.sort(), [
			'blog.json',
			'blog/bar.json',
			'blog/bar/index.html',
			'blog/baz.json',
			'blog/baz/index.html',
			'blog/foo.json',
			'blog/foo/index.html',
			'blog/index.html',
			'global.css',
			'index.html',
			'service-worker-index.html',
			'service-worker.js',
			'test.pdf',
			...boom
		].sort());
	});

	it('does not corrupt binary file links (like pdf)', () => {
		const input = readFileSync(`${__dirname}/static/test.pdf`)
		const output = readFileSync(`${__dirname}/__sapper__/export/test.pdf`)
		assert.ok(input.equals(output))
	})

	// TODO test timeout, basepath
});
