import * as assert from 'assert';
import { build } from '../../../api';
import { AppRunner } from '../AppRunner';

describe('template transform', function () {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	it('%arbitrary.globalCss% replaced with "global.css?v=[hash]"', async () => {
		await r.load('/');

		assert.strictEqual(
			await r.page.$eval('#globalCssHashed', (node) =>
				node.getAttribute('href')
			),
			'global.css?v=a69e2c8112ad988b3040f19aa6ceaed7'
		);
	});

	it("can override Sapper's replacements before they run", async () => {
		await r.load('/');

		assert.ok(
			/none-more-black/.test(
				await r.page.$eval('html', (node) => node.innerHTML)
			),
			'Found default replacement for %sapper.styles% despite trying to override'
		);
	});

	it("can re-implement Sapper's replacements with `data` arg", async () => {
		await r.load('/');

		assert.strictEqual(
			await r.page.$eval('base', (node) =>
				node.getAttribute('href')
			),
			'/'
		);
	});

	it("Sapper's remaining replacements still worked", async () => {
		await r.load('/');

		assert.ok(
			!/%sapper\..*?%/.test(
				await r.page.$eval('html', (node) => node.innerHTML)
			),
			'Found instance of "%sapper.<string>%"'
		);
	});
});
