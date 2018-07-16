const path = require('path');
const assert = require('assert');
const { create_routes } = require('../../../dist/core.ts.js');

describe.only('create_routes', () => {
	it('creates routes', () => {
		const { components, pages, server_routes } = create_routes(path.join(__dirname, 'samples/basic'));

		const page_index = { name: 'page_index', file: '_default.html' };
		const page_about = { name: 'page_about', file: 'about.html' };
		const page_blog = { name: 'page_blog', file: 'blog/index.html' };
		const page_blog_index = { name: 'page_blog_index', file: 'blog/_default.html' };
		const page_blog_$slug = { name: 'page_blog_$slug', file: 'blog/[slug].html' };

		assert.deepEqual(components, [
			page_index,
			page_about,
			page_blog,
			page_blog_index,
			page_blog_$slug
		]);

		assert.deepEqual(pages, [
			{
				pattern: /^\/?$/,
				parts: [
					{ component: page_index, params: [] }
				]
			},

			{
				pattern: /^\/about\/?$/,
				parts: [
					{ component: page_about, params: [] }
				]
			},

			{
				pattern: /^\/blog\/?$/,
				parts: [
					{ component: page_blog, params: [] },
					{ component: page_blog_index, params: [] }
				]
			},

			{
				pattern: /^\/blog\/([^\/]+?)\/?$/,
				parts: [
					{ component: page_blog, params: [] },
					{ component: page_blog_$slug, params: ['slug'] }
				]
			}
		]);

		assert.deepEqual(server_routes, [
			{
				name: 'route_blog_json',
				pattern: /^\/blog.json\/?$/,
				file: 'blog/index.json.js',
				params: []
			},

			{
				name: 'route_blog_$slug_json',
				pattern: /^\/blog\/([^\/]+?).json\/?$/,
				file: 'blog/[slug].json.js',
				params: ['slug']
			}
		]);
	});

	it('encodes invalid characters', () => {
		const { components, pages } = create_routes(path.join(__dirname, 'samples/encoding'));

		const quote = { name: 'page_$34', file: '".html' };
		const hash = { name: 'page_$35', file: '#.html' };
		const question_mark = { name: 'page_$63', file: '?.html' };

		assert.deepEqual(components, [
			quote,
			hash,
			question_mark
		]);

		assert.deepEqual(pages.map(p => p.pattern), [
			/^\/%22\/?$/,
			/^\/%23\/?$/,
			/^\/%3F\/?$/
		]);
	});

	it('allows regex qualifiers', () => {
		const { pages } = create_routes(path.join(__dirname, 'samples/qualifiers'));

		assert.deepEqual(pages.map(p => p.pattern), [
			/^\/([0-9-a-z]{3,})\/?$/,
			/^\/([a-z]{2})\/?$/,
			/^\/([^\/]+?)\/?$/
		]);
	});

	it('sorts routes correctly', () => {
		const { pages } = create_routes(path.join(__dirname, 'samples/sorting'));

		assert.deepEqual(pages.map(p => p.parts.map(part => part.component.file)), [
			['_default.html'],
			['about.html'],
			['post/index.html', 'post/_default.html'],
			['post/index.html', 'post/bar.html'],
			['post/index.html', 'post/foo.html'],
			['post/index.html', 'post/f[xx].html'],
			['post/index.html', 'post/[id([0-9-a-z]{3,})].html'],
			['post/index.html', 'post/[id].html'],
			['[wildcard].html']
		]);
	});

	it('ignores files and directories with leading underscores', () => {
		const { server_routes } = create_routes(path.join(__dirname, 'samples/hidden-underscore'));

		assert.deepEqual(server_routes.map(r => r.file), [
			'index.js',
			'e/f/g/h.js'
		]);
	});

	it('ignores files and directories with leading dots except .well-known', () => {
		const { server_routes } = create_routes(path.join(__dirname, 'samples/hidden-dot'));

		assert.deepEqual(server_routes.map(r => r.file), [
			'.well-known/dnt-policy.txt.js'
		]);
	});

	it('fails on clashes', () => {
		assert.throws(() => {
			const { pages } = create_routes(path.join(__dirname, 'samples/clash-pages'));
			console.log(pages);
		}, /The \[bar\]\/index\.html and \[foo\]\.html pages clash/);

		assert.throws(() => {
			const { server_routes } = create_routes(path.join(__dirname, 'samples/clash-routes'));
			console.log(server_routes);
		}, /The \[bar\]\/index\.js and \[foo\]\.js routes clash/);
	});
});