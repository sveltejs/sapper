const path = require('path');
const assert = require('assert');
const Nightmare = require('nightmare');
const express = require('express');
const serve = require('serve-static');
const walkSync = require('walk-sync');
const fetch = require('node-fetch');

run('production');
run('development');

Nightmare.action('page', {
	title(done) {
		this.evaluate_now(() => document.querySelector('h1').textContent, done);
	}
});

function run(env) {
	describe(`env=${env}`, function () {
		this.timeout(20000);

		let PORT;
		let server;
		let nightmare;
		let middleware;
		let capture;

		let base;

		function get(url) {
			return new Promise(fulfil => {
				const req = {
					url,
					method: 'GET'
				};

				const result = {
					headers: {},
					body: ''
				};

				const res = {
					setHeader(header, value) {
						result.headers[header] = value;
					},

					set(headers, value) {
						if (typeof headers === 'string') {
							return res.set({ [headers]: value });
						}

						Object.assign(result.headers, headers);
					},

					status(code) {
						result.status = code;
					},

					write(data) {
						result.body += data;
					},

					end(data) {
						result.body += data;
						fulfil(result);
					}
				};

				middleware(req, res, () => {
					fulfil(result);
				});
			});
		}

		before(() => {
			process.chdir(path.resolve(__dirname, '../app'));

			process.env.NODE_ENV = env;

			let exec_promise = Promise.resolve();
			let sapper;

			if (env === 'production') {
				const cli = path.resolve(__dirname, '../../cli.js');
				exec_promise = exec(`node ${cli} export`);
			}

			return exec_promise.then(() => {
				const resolved = require.resolve('../../middleware.js');
				delete require.cache[resolved];
				delete require.cache[require.resolve('../../core.js')]; // TODO remove this

				sapper = require(resolved);

				return require('get-port')();
			}).then(port => {
				PORT = port;
				base = `http://localhost:${PORT}`;

				Nightmare.action('init', function(done) {
					this.evaluate_now(() => window.init(), done);
				});

				global.fetch = (url, opts) => {
					if (url[0] === '/') url = `${base}${url}`;
					return fetch(url, opts);
				};

				let captured;
				capture = fn => {
					const result = captured = [];
					return fn().then(() => {
						captured = null;
						return result;
					});
				};

				const app = express();

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

				nightmare.on('page', (type, ...args) => {
					if (type === 'error') {
						console.error(args[1]);
					} else {
						console.warn(type, args);
					}
				});
			});

			afterEach(() => {
				return nightmare.end();
			});

			it('serves /', () => {
				return nightmare.goto(base).page.title().then(title => {
					assert.equal(title, 'Great success!');
				});
			});

			it('serves static route', () => {
				return nightmare.goto(`${base}/about`).page.title().then(title => {
					assert.equal(title, 'About this site');
				});
			});

			it('serves dynamic route', () => {
				return nightmare.goto(`${base}/blog/what-is-sapper`).page.title().then(title => {
					assert.equal(title, 'What is Sapper?');
				});
			});

			it('navigates to a new page without reloading', () => {
				return nightmare.goto(base).init().wait(100)
					.then(() => {
						return capture(() => nightmare.click('a[href="/about"]'));
					})
					.then(requests => {
						assert.deepEqual(requests.map(r => r.url), []);
						return nightmare.path();
					})
					.then(path => {
						assert.equal(path, '/about');
						return nightmare.title();
					})
					.then(title => {
						assert.equal(title, 'About');
					});
			});

			it('navigates programmatically', () => {
				return nightmare
					.goto(`${base}/about`)
					.init()
					.click('.goto')
					.wait(() => window.location.pathname === '/blog/what-is-sapper')
					.wait(100)
					.title()
					.then(title => {
						assert.equal(title, 'What is Sapper?');
					});
			});

			it('prefetches programmatically', () => {
				return nightmare
					.goto(`${base}/about`)
					.init()
					.then(() => {
						return capture(() => {
							return nightmare
								.click('.prefetch')
								.wait(100);
						});
					})
					.then(requests => {
						assert.ok(!!requests.find(r => r.url === '/api/blog/why-the-name'));
					});
			});

			it('scrolls to active deeplink', () => {
				return nightmare
					.goto(`${base}/blog/a-very-long-post#four`)
					.init()
					.evaluate(() => window.scrollY)
					.then(scrollY => {
						assert.ok(scrollY > 0, scrollY);
					});
			});

			it('reuses prefetch promise', () => {
				return nightmare
					.goto(`${base}/blog`)
					.init().wait(100)
					.then(() => {
						return capture(() => {
							return nightmare
								.mouseover('[href="/blog/what-is-sapper"]')
								.wait(200);
						});
					})
					.then(mouseover_requests => {
						assert.deepEqual(mouseover_requests.map(r => r.url), [
							'/api/blog/what-is-sapper'
						]);

						return capture(() => {
							return nightmare
								.click('[href="/blog/what-is-sapper"]')
								.wait(200);
						});
					})
					.then(click_requests => {
						assert.deepEqual(click_requests.map(r => r.url), []);
					});
			});

			it('cancels navigation if subsequent navigation occurs during preload', () => {
				return nightmare
					.goto(base)
					.init()
					.click('a[href="/slow-preload"]')
					.wait(100)
					.click('a[href="/about"]')
					.wait(100)
					.then(() => nightmare.path())
					.then(path => {
						assert.equal(path, '/about');
						return nightmare.title();
					})
					.then(title => {
						assert.equal(title, 'About');
						return nightmare.evaluate(() => window.fulfil({})).wait(100);
					})
					.then(() => nightmare.path())
					.then(path => {
						assert.equal(path, '/about');
						return nightmare.title();
					})
					.then(title => {
						assert.equal(title, 'About');
					});
			});

			it('passes entire request object to preload', () => {
				return nightmare
					.goto(`${base}/show-url`)
					.init()
					.evaluate(() => document.querySelector('p').innerHTML)
					.end().then(html => {
						assert.equal(html, `URL is /show-url`);
					});
			});

			it('calls a delete handler', () => {
				return nightmare
					.goto(`${base}/delete-test`)
					.init()
					.click('.del')
					.wait(() => window.deleted)
					.evaluate(() => window.deleted.id)
					.then(id => {
						assert.equal(id, 42);
					});
			});

			it('hydrates initial route', () => {
				return nightmare.goto(base)
					.wait('.hydrate-test')
					.evaluate(() => {
						window.el = document.querySelector('.hydrate-test');
					})
					.init()
					.evaluate(() => {
						return document.querySelector('.hydrate-test') === window.el;
					})
					.then(matches => {
						assert.ok(matches);
					});
			});
		});

		describe('headers', () => {
			it('sets Content-Type and Link...preload headers', () => {
				return get('/').then(({ headers }) => {
					assert.equal(
						headers['Content-Type'],
						'text/html'
					);

					assert.ok(
						/<\/client\/main.\w+\.js>;rel="preload";as="script", <\/client\/_.\d+.\w+.js>;rel="preload";as="script"/.test(headers['Link']),
						headers['Link']
					);
				});
			});
		});

		if (env === 'production') {
			describe('export', () => {
				it('export all pages', () => {
					const dest = path.resolve(__dirname, '../app/dist');

					// Pages that should show up in the extraction directory.
					const expectedPages = [
						'index.html',
						'about/index.html',
						'slow-preload/index.html',

						'blog/index.html',
						'blog/a-very-long-post/index.html',
						'blog/how-can-i-get-involved/index.html',
						'blog/how-is-sapper-different-from-next/index.html',
						'blog/how-to-use-sapper/index.html',
						'blog/what-is-sapper/index.html',
						'blog/why-the-name/index.html',

						'api/blog/contents',
						'api/blog/a-very-long-post',
						'api/blog/how-can-i-get-involved',
						'api/blog/how-is-sapper-different-from-next',
						'api/blog/how-to-use-sapper',
						'api/blog/what-is-sapper',
						'api/blog/why-the-name',

						'favicon.png',
						'global.css',
						'great-success.png',
						'manifest.json',
						'service-worker.js',
						'svelte-logo-192.png',
						'svelte-logo-512.png',
					];
					// Client scripts that should show up in the extraction directory.
					const expectedClientRegexes = [
						/client\/_\..*?\.js/,
						/client\/about\..*?\.js/,
						/client\/blog_\$slug\$\..*?\.js/,
						/client\/blog\..*?\.js/,
						/client\/main\..*?\.js/,
						/client\/show_url\..*?\.js/,
						/client\/slow_preload\..*?\.js/,
					];
					const allPages = walkSync(dest);

					expectedPages.forEach((expectedPage) => {
						assert.ok(allPages.includes(expectedPage),
						    `Could not find page matching ${expectedPage}`);
					});
					expectedClientRegexes.forEach((expectedRegex) => {
						// Ensure each client page regular expression matches at least one
						// generated page.
						let matched = false;
						for (const page of allPages) {
							if (expectedRegex.test(page)) {
								matched = true;
								break;
							}
						}
						assert.ok(matched,
							  `Could not find client page matching ${expectedRegex}`);
					});
				});
			});
		}
	});
}

function exec(cmd) {
	return new Promise((fulfil, reject) => {
		const parts = cmd.split(' ');
		const proc = require('child_process').spawn(parts.shift(), parts);

		proc.stdout.on('data', data => {
			process.stdout.write(data);
		});

		proc.stderr.on('data', data => {
			process.stderr.write(data);
		});

		proc.on('error', reject);

		proc.on('close', () => fulfil());
	});
}
