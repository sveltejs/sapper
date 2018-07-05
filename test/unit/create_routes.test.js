const assert = require('assert');
const { create_routes } = require('../../dist/core.ts.js');

describe('create_routes', () => {
	it('encodes characters not allowed in path', () => {
		const { server_routes } = create_routes({
			files: [
				'"',
				'#',
				'?'
			]
		});

		assert.deepEqual(
			server_routes.map(r => r.pattern),
			[
				/^\/%22\/?$/,
				/^\/%23\/?$/,
				/^\/%3F\/?$/
			]
		);
	});

	it('sorts routes correctly', () => {
		const { pages, server_routes } = create_routes({
			files: [
				'index.html',
				'about.html',
				'post/f[xx].html',
				'[wildcard].html',
				'post/foo.html',
				'post/[id].html',
				'post/bar.html',
				'post/[id].json.js',
				'post/[id([0-9-a-z]{3,})].html',
			]
		});

		assert.deepEqual(
			pages.map(r => r.file),
			[
				'index.html',
				'about.html',
				'post/bar.html',
				'post/foo.html',
				'post/f[xx].html',
				'post/[id([0-9-a-z]{3,})].html', // RegExp is more specific
				'post/[id].html',
				'[wildcard].html'
			]
		);

		assert.deepEqual(
			server_routes.map(r => r.file),
			[
				'post/[id].json.js'
			]
		);
	});

	it('distinguishes and sorts regexp routes correctly', () => {
		const { pages } = create_routes({
			files: [
				'[slug].html',
				'[slug([a-z]{2})].html',
				'[slug([0-9-a-z]{3,})].html',
			]
		});

		assert.deepEqual(
			pages.map(r => r.file),
			[
				'[slug([0-9-a-z]{3,})].html',
				'[slug([a-z]{2})].html',
				'[slug].html',
			]
		);
	});

	it('prefers index page to nested route', () => {
		let { pages, server_routes } = create_routes({
			files: [
				'api/examples/[slug].js',
				'api/examples/index.js',
				'blog/[slug].html',
				'api/gists/[id].js',
				'api/gists/index.js',
				'_error.html',
				'blog/index.html',
				'blog/rss.xml.js',
				'guide/index.html',
				'index.html'
			]
		});

		assert.deepEqual(
			pages.map(r => r.file),
			[
				'_error.html',
				'index.html',
				'guide/index.html',
				'blog/index.html',
				'blog/[slug].html'
			]
		);

		assert.deepEqual(
			server_routes.map(r => r.file),
			[
				'blog/rss.xml.js',
				'api/examples/index.js',
				'api/examples/[slug].js',
				'api/gists/index.js',
				'api/gists/[id].js',
			]
		);

		({ pages, server_routes } = create_routes({
			files: [
				'_error.html',
				'api/blog/[slug].js',
				'api/blog/index.js',
				'api/guide/contents.js',
				'api/guide/index.js',
				'blog/[slug].html',
				'blog/index.html',
				'blog/rss.xml.js',
				'gist/[id].js',
				'gist/create.js',
				'guide/index.html',
				'index.html',
				'repl/index.html'
			]
		}));

		assert.deepEqual(
			pages.map(r => r.file),
			[
				'_error.html',
				'index.html',
				'guide/index.html',
				'blog/index.html',
				'blog/[slug].html',
				'repl/index.html'
			]
		);

		assert.deepEqual(
			server_routes.map(r => r.file),
			[
				'blog/rss.xml.js',
				'gist/create.js',
				'gist/[id].js',
				'api/guide/index.js',
				'api/guide/contents.js',
				'api/blog/index.js',
				'api/blog/[slug].js',
			]
		);

		// RegExp routes
		({ pages } = create_routes({
			files: [
				'blog/[slug].html',
				'blog/index.html',
				'blog/[slug([^0-9]+)].html',
			]
		}));

		assert.deepEqual(
			pages.map(r => r.file),
			[
				'blog/index.html',
				'blog/[slug([^0-9]+)].html',
				'blog/[slug].html',
			]
		);
	});

	it('generates params', () => {
		const { pages } = create_routes({
			files: ['index.html', 'about.html', '[wildcard].html', 'post/[id].html']
		});

		let file;
		let params;
		for (let i = 0; i < pages.length; i += 1) {
			const route = pages[i];
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
		const { pages } = create_routes({
			files: ['index.html', '_foo.html', 'a/_b/c/d.html', 'e/f/g/h.html', 'i/_j.html']
		});

		assert.deepEqual(
			pages.map(r => r.file),
			[
				'index.html',
				'e/f/g/h.html'
			]
		);
	});

	it('ignores files and directories with leading dots except .well-known', () => {
		const { server_routes } = create_routes({
			files: ['.well-known/dnt-policy.txt.js', '.unknown/foo.txt.js']
		});

		assert.deepEqual(
			server_routes.map(r => r.file),
			['.well-known/dnt-policy.txt.js']
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
			a.pages.map(r => r.file),
			['foo/[bar].html', '[baz]/qux.html']
		);

		assert.deepEqual(
			b.pages.map(r => r.file),
			['foo/[bar].html', '[baz]/qux.html']
		);
	});

	it('fails if routes are indistinguishable', () => {
		assert.throws(() => {
			create_routes({
				files: ['[foo].html', '[bar]/index.html']
			});
		}, /The \[foo\] and \[bar\]\/index routes clash/);

		assert.throws(() => {
			create_routes({
				files: ['[foo([0-9-a-z]+)].html', '[bar([0-9-a-z]+)]/index.html']
			});
		}, /The \[foo\(\[0-9-a-z\]\+\)\] and \[bar\(\[0-9-a-z\]\+\)\]\/index routes clash/);
	});


	it('matches nested routes', () => {
		const page = create_routes({
			files: ['settings/[submenu].html']
		}).pages[0];

		assert.deepEqual(page.exec('/settings/foo'), {
			submenu: 'foo'
		});

		assert.deepEqual(page.exec('/settings'), {
			submenu: null
		});
	});

	it('prefers index routes to nested routes', () => {
		const { pages } = create_routes({
			files: ['settings/[submenu].html', 'settings.html']
		});

		assert.deepEqual(
			pages.map(r => r.file),
			['settings.html', 'settings/[submenu].html']
		);
	});

	it('matches deeply nested routes', () => {
		const page = create_routes({
			files: ['settings/[a]/[b]/index.html']
		}).pages[0];

		assert.deepEqual(page.exec('/settings/foo/bar'), {
			a: 'foo',
			b: 'bar'
		});

		assert.deepEqual(page.exec('/settings/foo'), {
			a: 'foo',
			b: null
		});

		assert.deepEqual(page.exec('/settings'), {
			a: null,
			b: null
		});
	});

	it('matches a dynamic part within a part', () => {
		const route = create_routes({
			files: ['things/[slug].json.js']
		}).server_routes[0];

		assert.deepEqual(route.exec('/things/foo.json'), {
			slug: 'foo'
		});
	});

	it('matches multiple dynamic parts within a part', () => {
		const route = create_routes({
			files: ['things/[id]_[slug].json.js']
		}).server_routes[0];

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

	it('errors when trying to use reserved characters in route regexp', () => {
		assert.throws(() => {
			create_routes({
				files: ['[lang([a-z]{2}(?:-[a-z]{2,4})?)]']
			});
		}, /Sapper does not allow \(, \), \? or \: in RegExp routes yet/);
	});

	it('errors on 4xx.html', () => {
		assert.throws(() => {
			create_routes({
				files: ['4xx.html']
			});
		}, /As of Sapper 0.14, 4xx.html and 5xx.html should be replaced with _error.html/);
	});

	it('errors on 5xx.html', () => {
		assert.throws(() => {
			create_routes({
				files: ['5xx.html']
			});
		}, /As of Sapper 0.14, 4xx.html and 5xx.html should be replaced with _error.html/);
	});

	it('treats foo/index.json.js the same as foo.json.js', () => {
		const route = create_routes({
			files: ['foo/index.json.js']
		}).server_routes[0];

		assert.ok(route.test('/foo.json'));
	});
});