import * as assert from 'assert';
import * as http from 'http';
import {build} from '../../../api';
import {AppRunner} from '../AppRunner';

declare let deleted: { id: number };
declare let el: any;

type Response = { headers: http.IncomingHttpHeaders, body: string };

function get(url: string, opts: http.RequestOptions = {}): Promise<Response> {
	return new Promise((fulfil, reject) => {
		const req = http.get(url, opts, res => {
			res.on('error', reject);

			let body = '';
			res.on('data', chunk => body += chunk);
			res.on('end', () => {
				fulfil({
					headers: res.headers,
					body
				});
			});
		});

		req.on('error', reject);
	});
}

describe('hydration', function() {
	this.timeout(10000);

	let r: AppRunner;

	// hooks
	before('build app', () => build({ cwd: __dirname }));
	before('start runner', async () => {
		r = await new AppRunner().start(__dirname);
	});

	after(() => r && r.end());

	it('hydrates script headers correctly', async () => {
		await r.load('/');
		assert.deepEqual(
			r.console_messages,
			[
				"hello from Nav",
				"hello from some-script.js",
				"hello from some-other-script.js"
			]
		);
	});
});
