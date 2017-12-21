const fs = require('fs');
const path = require('path');
const assert = require('assert');
const express = require('express');
const serve = require('serve-static');
const Nightmare = require('nightmare');
const getPort = require('get-port');
const fetch = require('node-fetch');

run('production');
run('development');

function run(env) {
	describe(`env=${env}`, function () {
		this.timeout(30000);

		let PORT;
		let server;
		let nightmare;
		let middleware;
		let capture;

		let base;

		function get(url) {
			return new Promise((fulfil, reject) => {
				const req = {
					url,
					method: 'GET'
				};

				const result = {
					headers: {},
					body: ''
				};

				const res = {
					set: (headers, value) => {
						if (typeof headers === 'string') {
							return res.set({ [headers]: value });
						}

						Object.assign(result.headers, headers);
					},

					status: code => {
						result.status = code;
					},

					write: data => {
						result.body += data;
					},

					end: data => {
						result.body += data;
						fulfil(result);
					}
				};

				middleware(req, res, () => {
					fulfil(result);
				});
			});
		}

		before(async () => {
			process.chdir(path.resolve(__dirname, '../app'));

			process.env.NODE_ENV = env;

			if (env === 'production') {
				const cli = path.resolve(__dirname, '../../cli/index.js');
				await exec(`${cli} build`);
			}

			const resolved = require.resolve('../..');
			delete require.cache[resolved];
			const sapper = require(resolved);

			PORT = await getPort();
			base = `http://localhost:${PORT}`;

			global.fetch = (url, opts) => {
				if (url[0] === '/') url = `${base}${url}`;
				return fetch(url, opts);
			};

			let captured;
			capture = async fn => {
				const result = captured = [];
				await fn();
				captured = null;
				return result;
			};

			app = express();

			app.use(serve('assets'));

			app.use((req, res, next) => {
				if (captured) captured.push(req);
				next();
			});

			middleware = sapper();
			app.use(middleware);

			return new Promise((fulfil, reject) => {
				server = app.listen(PORT, err => {
					if (err) reject(err);
					else fulfil();
				});
			});
		});

		after(() => {
			server.close();
			middleware.close();

			// give a chance to clean up
			return new Promise(fulfil => setTimeout(fulfil, 500));
		});

		describe('basic functionality', () => {
			beforeEach(() => {
				nightmare = new Nightmare();

				nightmare.on('console', (type, ...args) => {
					console[type](...args);
				});
			});

			afterEach(async () => {
				await nightmare.end();
			});

			it('serves /', async () => {
				const title = await nightmare
					.goto(base)
					.evaluate(() => document.querySelector('h1').textContent);

				assert.equal(title, 'Great success!');
			});

			it('serves static route', async () => {
				const title = await nightmare
					.goto(`${base}/about`)
					.evaluate(() => document.querySelector('h1').textContent);

				assert.equal(title, 'About this site');
			});

			it('serves dynamic route', async () => {
				const title = await nightmare
					.goto(`${base}/blog/what-is-sapper`)
					.evaluate(() => document.querySelector('h1').textContent);

				assert.equal(title, 'What is Sapper?');
			});

			it('navigates to a new page without reloading', async () => {
				await nightmare.goto(base);

				const requests = await capture(async () => {
					await nightmare.click('a[href="/about"]');
				});

				assert.equal(
					await nightmare.path(),
					'/about'
				);

				assert.equal(
					await nightmare.evaluate(() => document.title),
					'About'
				);

				assert.deepEqual(requests.map(r => r.url), []);
			});
		});

		describe('headers', () => {
			it('sets Content-Type and Link...preload headers', async () => {
				const { headers } = await get('/');

				assert.equal(
					headers['Content-Type'],
					'text/html'
				);

				assert.ok
					(/<\/client\/main.\w+\.js\>;rel="preload";as="script", <\/client\/_.\d+.\w+.js>;rel="preload";as="script"/.test(headers['Link']),
					headers['Link']
				);
			});
		});
	});
}

function exec(cmd) {
	return new Promise((fulfil, reject) => {
		require('child_process').exec(cmd, (err, stdout, stderr) => {
			if (err) return reject(err);

			process.stdout.write(stdout);
			process.stderr.write(stderr);
			fulfil();
		});
	});
}