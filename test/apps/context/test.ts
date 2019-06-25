import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('context', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('renders context props', async () => {
		await r.load('/context');

		assert.equal(await r.text('h1'), 'hello server');

		await r.sapper.start();
		assert.equal(await r.text('h1'), 'hello browser');
	});

	it('preloads context props', async () => {
		await r.load('/preloaded');

		assert.equal(await r.text('h1'), 'hello server');
		assert.equal(await r.text('h2'), 'hello server');

		await r.sapper.start();
		assert.equal(await r.text('h1'), 'hello server');
		assert.equal(await r.text('h2'), 'hello server');
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
