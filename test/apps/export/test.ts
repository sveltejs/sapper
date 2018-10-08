import * as assert from 'assert';
import { walk } from '../../utils';
import * as api from '../../../api';

describe('export', function() {
	this.timeout(10000);

	// hooks
	before(async () => {
		// TODO this is brittle. Make it unnecessary
		process.chdir(__dirname);
		process.env.NODE_ENV = 'production';

		await api.build();

		// TODO it'd be nice if build and export returned promises.
		// not sure how best to combine promise and event emitter
		await api.export({
			build: '__sapper__/build',
			dest: '__sapper__/export',
			static: 'static',
			basepath: '',
			timeout: 5000
		});
	});

	it('crawls a site', () => {
		const files = walk('__sapper__/export');

		const client_assets = files.filter(file => file.startsWith('client/'));
		const non_client_assets = files.filter(file => !file.startsWith('client/')).sort();

		assert.ok(client_assets.length > 0);

		assert.deepEqual(non_client_assets, [
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
			'service-worker.js'
		]);
	});

	// TODO test timeout, basepath
});