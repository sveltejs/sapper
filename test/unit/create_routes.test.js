const path = require('path');
const assert = require('assert');

const create_routes = require('../../lib/utils/create_routes.js');

describe('create_routes', () => {
	it('sorts routes correctly', () => {
		const routes = create_routes(['index.html', 'about.html', '[wildcard].html', 'post/foo.html', 'post/[id].html', 'post/bar.html']);

		assert.deepEqual(
			routes.map(r => r.file),
			[
				'post/foo.html',
				'post/bar.html',
				'post/[id].html',
				'about.html',
				'[wildcard].html',
				'index.html'
			]
		);
	});

	it('generates params', () => {
		const routes = create_routes(['index.html', 'about.html', '[wildcard].html', 'post/[id].html']);

		let file;
		let params;
		for (let i = 0; i < routes.length; i += 1) {
			const route = routes[i];
			if (params = route.exec('/post/123')) {
				file = route.file;
				break;
			}
		}

		assert.equal(file, 'post/[id].html');
		assert.deepEqual(params, {
			id: '123'
		});
	});

	it('ignores files and directories with leading underscores', () => {
		const routes = create_routes(['index.html', '_foo.html', 'a/_b/c/d.html', 'e/f/g/h.html', 'i/_j.html']);

		assert.deepEqual(
			routes.map(r => r.file),
			[
				'e/f/g/h.html',
				'index.html'
			]
		);
	});

	it('matches /foo/:bar before /:baz/qux', () => {
		const a = create_routes(['foo/[bar].html', '[baz]/qux.html']);
		const b = create_routes(['[baz]/qux.html', 'foo/[bar].html']);

		assert.deepEqual(
			a.map(r => r.file),
			['foo/[bar].html', '[baz]/qux.html']
		);

		assert.deepEqual(
			b.map(r => r.file),
			['foo/[bar].html', '[baz]/qux.html']
		);
	});

	it('fails if routes are indistinguishable', () => {
		assert.throws(() => {
			create_routes(['[foo].html', '[bar]/index.html']);
		}, /The \[foo\].html and \[bar\]\/index.html routes clash/);
	});
});