import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('session', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('renders session props', async () => {
		await r.load('/session');

		assert.strictEqual(await r.text('h1'), 'hello world');

		await r.sapper.start();
		assert.strictEqual(await r.text('h1'), 'hello world');

		await r.page.click('button');
		assert.strictEqual(await r.text('h1'), 'changed');
	});

	it('preloads session props', async () => {
		await r.load('/preloaded');

		assert.strictEqual(await r.text('h1'), 'hello world');

		await r.sapper.start();
		assert.strictEqual(await r.text('h1'), 'hello world');

		await r.page.click('button');
		assert.strictEqual(await r.text('h1'), 'changed');
	});

	it('survives exception from session getter', async () => {
		await r.load('/error');
	});

	it('survives the tests with no server errors', () => {
		assert.deepStrictEqual(r.errors, []);
	});
});
