import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('cspnonce-with-helmet', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	// without the fix in runtime/src/server/middleware/get_page_handler.ts 
	// this will fail as the script to do the updates will be blocked
	it('does not prevent bindings from working', async () => {
		await r.load('/');
		await r.sapper.start();

		assert.equal(await r.text('span'), '-');

		await r.page.type('input[type="text"]', 'text');

		assert.equal(await r.text('span'), 'text');
	});
});
