import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('encoding', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// tests
	it('encodes routes', async () => {
		await r.load('/fünke');

		assert.equal(
			await r.text('h1'),
			`I'm afraid I just blue myself`
		);
	});

	it('encodes req.params and req.query for server-rendered pages', async () => {
		await r.load('/echo/page/encöded?message=hëllö+wörld&föo=bar&=baz&tel=%2B123456789');

		assert.equal(
			await r.text('h1'),
			'encöded {"message":"hëllö wörld","föo":"bar","":"baz","tel":"+123456789"}'
		);
	});

	it('encodes req.params and req.query for client-rendered pages', async () => {
		await r.load('/');
		await r.sapper.start();
		await r.sapper.prefetchRoutes();

		await r.page.click('a');
		await r.wait();

		assert.equal(
			await r.text('h1'),
			'encöded {"message":"hëllö wörld","föo":"bar","":"baz","tel":"+123456789"}'
		);
	});

	it('encodes req.params for server routes', async () => {
		await r.load('/echo/server-route/encöded');

		assert.equal(
			await r.text('h1'),
			'encöded'
		);
	});

	it('survives the tests with no server errors', () => {
		assert.deepEqual(r.errors, []);
	});
});
