import * as assert from 'assert';
import {build} from '../../../api';
import {AppRunner} from '../AppRunner';

describe('without-basetag', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('navigates between routes with empty parts', async () => {
		await r.load('/dirs/foo');
		await r.sapper.start();

		assert.equal(await r.text('h1'), 'foo');
		await r.page.click('[href="bar"]');
		await r.wait();
		assert.equal(await r.text('h1'), 'bar');
	});

	it('navigates between dynamic routes with same segments', async () => {
		await r.load('/dirs/bar/xyz');
		await r.sapper.start();

		assert.equal(await r.text('h1'), 'A page');

		await r.page.click('[href="../foo/xyz"]');
		await r.wait();
		assert.equal(await r.text('h1'), 'B page');
	});
});
