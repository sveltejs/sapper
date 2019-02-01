import * as puppeteer from 'puppeteer';
import { build } from '../../../api';
import * as assert from "assert";
import { AppRunner } from '../AppRunner';
import * as fs from 'fs';
import * as path from "path";

describe('with-sourcemaps', function() {
	this.timeout(10000);

	let runner: AppRunner;
	let page: puppeteer.Page;
	let base: string;

	// helpers
	let start: () => Promise<void>;
	let prefetchRoutes: () => Promise<void>;
	let prefetch: (href: string) => Promise<void>;
	let goto: (href: string) => Promise<void>;

	// hooks
	before(async () => {
		await build({ cwd: __dirname });

		runner = new AppRunner(__dirname, '__sapper__/build/server/server.js');
		({ base, page, start, prefetchRoutes, prefetch, goto } = await runner.start());
	});

	it('does not put sourcemap files in service worker shell', async () => {
		const serviceWorker = await import(`${__dirname}/__sapper__/service-worker.js`);
		const shell: string[] = serviceWorker.shell;

		assert.equal(shell.filter(_ => _.endsWith('.map')).length, 0,
			'sourcemap files are not cached in SW');

		const clientShellDir = path.resolve(`${__dirname}/__sapper__/build`, path.dirname(shell[0]));
		const sourcemapFiles = fs.readdirSync(clientShellDir).filter(_ => _.endsWith('.map'));
		assert.ok(sourcemapFiles.length > 0, 'sourcemap files exist');
	});

	after(() => runner.end());

});