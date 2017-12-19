const path = require('path');
const assert = require('assert');

const create_routes = require('../../lib/utils/create_routes.js');

describe('create_routes', () => {
	it('sorts routes correctly', () => {
		const routes = create_routes(['index.html', 'about.html', '[wildcard].html', 'post/[id].html']);

		assert.deepEqual(
			routes.map(r => r.file),
			[
				'about.html',
				'index.html',
				'post/[id].html',
				'[wildcard].html'
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
});