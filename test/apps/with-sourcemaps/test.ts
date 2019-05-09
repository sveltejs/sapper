import { build } from '../../../api';
import * as assert from "assert";
import * as fs from 'fs';
import * as path from "path";

describe('with-sourcemaps', function() {
	this.timeout(10000);

	// hooks
	before('build app', () => build({ cwd: __dirname }));

	// tests
	it('does not put sourcemap files in service worker shell', async () => {
		const service_worker_source = fs.readFileSync(`${__dirname}/src/node_modules/@sapper/service-worker.js`, 'utf-8');
		const shell_source = /shell = (\[[\s\S]+?\])/.exec(service_worker_source)[1];
		const shell = JSON.parse(shell_source);

		assert.equal(shell.filter(_ => _.endsWith('.map')).length, 0,
			'sourcemap files are not cached in SW');

		const clientShellDir = path.resolve(`${__dirname}/__sapper__/build`, path.dirname(shell[0]));
		const sourcemapFiles = fs.readdirSync(clientShellDir).filter(_ => _.endsWith('.map'));
		assert.ok(sourcemapFiles.length > 0, 'sourcemap files exist');
	});
});
