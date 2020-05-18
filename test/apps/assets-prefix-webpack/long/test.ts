import * as assert from 'assert';
import { build } from '../../../../api';
import { AppRunner } from '../../AppRunner';
import { validateLink } from '../utils';

describe('assetsPrefix long publicPath', function () {
	this.timeout(10000);

	let r: AppRunner;

	before(async () => {
		await build({ cwd: __dirname, bundler: 'webpack' });
		r = await new AppRunner().start(__dirname);
	});
	after(() => r && r.end());

	it('long publicPath', async () => {
		const res = await r.load('/');

		assert.ok(
			await r.page.evaluate(() => {
				const src = [...document.querySelectorAll('script')]
					.filter((script) => script.src.includes('main.js'))[0].src;
				return /^https:\/\/127.0.0.1:9999\/foo\/bar\/client\//.test(src);
			}),
			'main.js path error'
		);
		assert.ok(
			await r.page.evaluate(() => {
				return [...document.querySelectorAll('link')]
					.filter((link) => link.href.includes('.css'))
					.every((link) => /^https:\/\/127.0.0.1:9999\/foo\/bar\/client\//.test(link.href));
			}),
			'css path error'
		);
		assert.ok(
			validateLink(res.headers().link, new RegExp('^<https://127.0.0.1:9999/foo/bar/client/')),
			'http links path error'
		);
	});
});
