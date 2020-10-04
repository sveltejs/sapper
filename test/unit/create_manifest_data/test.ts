import * as path from 'path';
import * as assert from 'assert';
import create_manifest_data from '../../../src/core/create_manifest_data';

describe('manifest_data', () => {
	it('creates routes', () => {
		const { components, pages, server_routes } = create_manifest_data(path.join(__dirname, 'samples/basic'));

		const index = { name: 'index', file: 'index.html' };
		const about = { name: 'about', file: 'about.html' };
		const blog = { name: 'blog', file: 'blog/index.html' };
		const blog_$slug = { name: 'blog_$slug', file: 'blog/[slug].html' };

		assert.deepEqual(components, [
			index,
			about,
			blog,
			blog_$slug
		]);

		assert.deepEqual(pages, [
			{
				pattern: /^\/$/,
				parts: [
					{ component: index, params: [] }
				]
			},

			{
				pattern: /^\/about\/?$/,
				parts: [
					{ component: about, params: [] }
				]
			},

			{
				pattern: /^\/blog\/?$/,
				parts: [
					{ component: blog, params: [] }
				]
			},

			{
				pattern: /^\/blog\/([^/]+?)\/?$/,
				parts: [
					null,
					{ component: blog_$slug, params: ['slug'] }
				]
			}
		]);

		assert.deepEqual(server_routes, [
			{
				name: 'route_index',
				pattern:  /^\/$/,
				file: 'index.js',
				params: []
			},

			{
				name: 'route_blog_json',
				pattern: /^\/blog\.json$/,
				file: 'blog/index.json.js',
				params: []
			},

			{
				name: 'route_blog_$slug_json',
				pattern: /^\/blog\/([^/]+?)\.json$/,
				file: 'blog/[slug].json.js',
				params: ['slug']
			}
		]);
	});

	it('encodes invalid characters', () => {
		const { components, pages } = create_manifest_data(path.join(__dirname, 'samples/encoding'));

		// had to remove ? and " because windows

		// const quote = { name: '$34', file: '".html' };
		const hash = { name: '$35', file: '#.html' };
		// const question_mark = { name: '$63', file: '?.html' };

		assert.deepEqual(components, [
			// quote,
			hash
			// question_mark
		]);

		assert.deepEqual(pages.map(p => p.pattern), [
			// /^\/%22\/?$/,
			/^\/%23\/?$/
			// /^\/%3F\/?$/
		]);
	});

	it('allows regex qualifiers', () => {
		const { pages } = create_manifest_data(path.join(__dirname, 'samples/qualifiers'));

		assert.deepEqual(pages.map(p => p.pattern), [
			/^\/([0-9-a-z]{3,})\/?$/,
			/^\/([a-z]{2})\/?$/,
			/^\/([^/]+?)\/?$/
		]);
	});

	it('sorts routes correctly', () => {
		const { pages } = create_manifest_data(path.join(__dirname, 'samples/sorting'));

		assert.deepEqual(pages.map(p => p.parts.map(part => part && part.component.file)), [
			['index.html'],
			['about.html'],
			['post/index.html'],
			[null, 'post/bar.html'],
			[null, 'post/foo.html'],
			[null, 'post/f[xx].html'],
			[null, 'post/[id([0-9-a-z]{3,})].html'],
			[null, 'post/[id].html'],
			['[wildcard].html'],
			[null, null, null, '[...spread]/deep/[...deep_spread]/xyz.html'],
			[null, null, '[...spread]/deep/[...deep_spread]/index.html'],
			[null, '[...spread]/deep/index.html'],
			[null, '[...spread]/abc.html'],
			['[...spread]/index.html']
		]);
	});

	it('ignores files and directories with leading underscores', () => {
		const { server_routes } = create_manifest_data(path.join(__dirname, 'samples/hidden-underscore'));

		assert.deepEqual(server_routes.map(r => r.file), [
			'index.js',
			'e/f/g/h.js'
		]);
	});

	it('ignores files and directories with leading dots except .well-known', () => {
		const { server_routes } = create_manifest_data(path.join(__dirname, 'samples/hidden-dot'));

		assert.deepEqual(server_routes.map(r => r.file), [
			'.well-known/dnt-policy.txt.js'
		]);
	});

	it('allows multiple slugs', () => {
		const { server_routes } = create_manifest_data(path.join(__dirname, 'samples/multiple-slugs'));

		assert.deepEqual(server_routes, [
			{
				name: 'route_$file$93_$91ext',
				pattern: /^\/([^/]+?)\.([^/]+?)$/,
				file: '[file].[ext].js',
				params: ['file', 'ext']
			}
		]);
	});

	it('allows mutliple slugs with nested square brackets', () => {
		const { server_routes } = create_manifest_data(path.join(__dirname, 'samples/nested-square-brackets'));

		assert.deepEqual(server_routes, [
			{
				name: 'route_$file_$91ext$40$91a$45z$93$43$41$93',
				pattern: /^\/([a-z]+)\.([a-z]+)$/,
				file: '[file([a-z]+)].[ext([a-z]+)].js',
				params: ['file', 'ext']
			}
		]);
	});

	it('fails on clashes', () => {
		assert.throws(() => {
			create_manifest_data(path.join(__dirname, 'samples/clash-pages'));
		}, /The \[bar\]\/index\.html and \[foo\]\.html pages clash/);

		assert.throws(() => {
			const { server_routes } = create_manifest_data(path.join(__dirname, 'samples/clash-routes'));
			console.log(server_routes);
		}, /The \[bar\]\/index\.js and \[foo\]\.js routes clash/);
	});

	it('fails if dynamic params are not separated', () => {
		assert.throws(() => {
			create_manifest_data(path.join(__dirname, 'samples/invalid-params'));
		}, /Invalid route \[foo\]\[bar\]\.js — parameters must be separated/);
	});

	it('errors when trying to use reserved characters in route regexp', () => {
		assert.throws(() => {
			create_manifest_data(path.join(__dirname, 'samples/invalid-qualifier'));
		}, /Invalid route \[foo\(\[a-z\]\(\[0-9\]\)\)\].js — cannot use \(, \), \? or : in route qualifiers/);
	});

	it('ignores things that look like lockfiles' , () => {
		const { server_routes } = create_manifest_data(path.join(__dirname, 'samples/lockfiles'));

		assert.deepEqual(server_routes, [{
			file: 'foo.js',
			name: 'route_foo',
			params: [],
			pattern: /^\/foo\/?$/
		}]);
	});

	it('works with custom extensions' , () => {
		const { components, pages, server_routes } = create_manifest_data(path.join(__dirname, 'samples/custom-extension'), '.jazz .beebop .funk .html');

		const index = { name: 'index', file: 'index.funk' };
		const about = { name: 'about', file: 'about.jazz' };
		const blog = { name: 'blog', file: 'blog/index.html' };
		const blog_$slug = { name: 'blog_$slug', file: 'blog/[slug].beebop' };

		assert.deepEqual(components, [
			index,
			about,
			blog,
			blog_$slug
		]);

		assert.deepEqual(pages, [
			{
				pattern: /^\/$/,
				parts: [
					{ component: index, params: [] }
				]
			},

			{
				pattern: /^\/about\/?$/,
				parts: [
					{ component: about, params: [] }
				]
			},

			{
				pattern: /^\/blog\/?$/,
				parts: [
					{ component: blog, params: [] }
				]
			},

			{
				pattern: /^\/blog\/([^/]+?)\/?$/,
				parts: [
					null,
					{ component: blog_$slug, params: ['slug'] }
				]
			}
		]);

		assert.deepEqual(server_routes, [
			{
				name: 'route_blog_json',
				pattern: /^\/blog\.json$/,
				file: 'blog/index.json.js',
				params: []
			},
			{
				name: 'route_blog_$slug_json',
				pattern: /^\/blog\/([^/]+?)\.json$/,
				file: 'blog/[slug].json.js',
				params: ['slug']
			}
		]);
	});
});
