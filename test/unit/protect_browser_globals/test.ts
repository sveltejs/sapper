import protectBrowserGlobals from '../../../runtime/src/server/middleware/protect_browser_globals';
import * as assert from 'assert';

describe('protect_browser_globals', () => {
	it('handles sync functions', () => {
		assert.strictEqual(
			protectBrowserGlobals(() => 47),
			47
		);

		assert.throws(
			() =>
				protectBrowserGlobals(() => {
					console.log(document.location);

					return 47;
				}),
			{ name: 'IllegalAccessError' }
		);
	});

	it('handles async functions', async () => {
		assert.strictEqual(await protectBrowserGlobals(() => Promise.resolve(47)), 47);

		try {
			await protectBrowserGlobals(() =>
				Promise.resolve(47).then(() => {
					console.log(document.location);
				})
      );

      assert.fail('Did not throw.');
		} catch (e) {
			assert.strictEqual(e.name, 'IllegalAccessError');
		}
	});
});
