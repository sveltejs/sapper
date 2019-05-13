import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('layout', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('only recreates components when necessary', async () => {
		await r.load('/foo/bar/baz');

		const text1 = await r.text('#sapper');
		assert.deepEqual(text1.split('\n').map(str => str.trim()).filter(Boolean), [
			'y: bar 1',
			'z: baz 1',
			'goto foo/bar/qux',
			'goto foo/abc/def',
			'child segment: baz'
		]);

		await r.sapper.start();
		const text2 = await r.text('#sapper');
		assert.deepEqual(text2.split('\n').map(str => str.trim()).filter(Boolean), [
			'y: bar 1',
			'z: baz 1',
			'goto foo/bar/qux',
			'goto foo/abc/def',
			'child segment: baz'
		]);

		await r.page.click('[href="foo/bar/qux"]');
		await r.wait();

		const text3 = await r.text('#sapper');
		assert.deepEqual(text3.split('\n').map(str => str.trim()).filter(Boolean), [
			'y: bar 1',
			'z: qux 2',
			'goto foo/bar/qux',
			'goto foo/abc/def',
			'child segment: qux'
		]);

		await r.page.click('[href="foo/abc/def"]');
		await r.wait();

		const text4 = await r.text('#sapper');
		assert.deepEqual(text4.split('\n').map(str => str.trim()).filter(Boolean), [
			'y: abc 2',
			'z: def 3',
			'goto foo/bar/qux',
			'goto foo/abc/def',
			'child segment: def'
		]);
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
