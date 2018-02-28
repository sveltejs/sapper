const assert = require('assert');
const { create_routes } = require('../../core.js');

describe('create_routes', () => {
	it('sorts routes correctly', () => {
		const routes = create_routes({
			files: ['index.html', 'about.html', 'post/f[xx].html', '[wildcard].html', 'post/foo.html', 'post/[id].html', 'post/bar.html', 'post/[id].json.js']
		});

		assert.deepEqual(
			routes.map(r => r.file),
			[
				'index.html',
				'about.html',
				'post/foo.html',
				'post/bar.html',
				'post/f[xx].html',
				'post/[id].json.js',
				'post/[id].html',
				'[wildcard].html'
			]
		);
	});

	it('generates params', () => {
		const routes = create_routes({
			files: ['index.html', 'about.html', '[wildcard].html', 'post/[id].html']
		});

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
		const routes = create_routes({
			files: ['index.html', '_foo.html', 'a/_b/c/d.html', 'e/f/g/h.html', 'i/_j.html']
		});

		assert.deepEqual(
			routes.map(r => r.file),
			[
				'index.html',
				'e/f/g/h.html'
			]
		);
	});

	it('matches /foo/:bar before /:baz/qux', () => {
		const a = create_routes({
			files: ['foo/[bar].html', '[baz]/qux.html']
		});
		const b = create_routes({
			files: ['[baz]/qux.html', 'foo/[bar].html']
		});

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
			create_routes({
				files: ['[foo].html', '[bar]/index.html']
			});
		}, /The \[foo\].html and \[bar\]\/index.html routes clash/);

		assert.throws(() => {
			create_routes({
				files: ['foo.html', 'foo.js']
			});
		}, /The foo.html and foo.js routes clash/);
	});

	it('matches nested routes', () => {
		const route = create_routes({
			files: ['settings/[submenu].html']
		})[0];

		assert.deepEqual(route.exec('/settings/foo'), {
			submenu: 'foo'
		});

		assert.deepEqual(route.exec('/settings'), {
			submenu: null
		});
	});

	it('prefers index routes to nested routes', () => {
		const routes = create_routes({
			files: ['settings/[submenu].html', 'settings.html']
		});

		assert.deepEqual(
			routes.map(r => r.file),
			['settings.html', 'settings/[submenu].html']
		);
	});

	it('matches deeply nested routes', () => {
		const route = create_routes({
			files: ['settings/[a]/[b]/index.html']
		})[0];

		assert.deepEqual(route.exec('/settings/foo/bar'), {
			a: 'foo',
			b: 'bar'
		});

		assert.deepEqual(route.exec('/settings/foo'), {
			a: 'foo',
			b: null
		});

		assert.deepEqual(route.exec('/settings'), {
			a: null,
			b: null
		});
	});

	it('matches a dynamic part within a part', () => {
		const route = create_routes({
			files: ['things/[slug].json.js']
		})[0];

		assert.deepEqual(route.exec('/things/foo.json'), {
			slug: 'foo'
		});
	});

	it('matches multiple dynamic parts within a part', () => {
		const route = create_routes({
			files: ['things/[id]_[slug].json.js']
		})[0];

		assert.deepEqual(route.exec('/things/someid_someslug.json'), {
			id: 'someid',
			slug: 'someslug'
		});
	});

	it('fails if dynamic params are not separated', () => {
		assert.throws(() => {
			create_routes({
				files: ['[foo][bar].js']
			});
		}, /Invalid route \[foo\]\[bar\]\.js — parameters must be separated/);
	});
});