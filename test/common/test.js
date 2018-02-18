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

Nightmare.action('init', function(done) {
	this.evaluate_now(() => window.init(), done);
});

function run(env) {
	describe(`env=${env}`, function () {
		this.timeout(20000);

		let PORT;
		let proc;
		let nightmare;
		let capture;

		let base;

		before(() => {
			process.chdir(path.resolve(__dirname, '../app'));

			let exec_promise = Promise.resolve();

			if (env === 'production') {
				const cli = path.resolve(__dirname, '../../cli.js');
				exec_promise = exec(`node ${cli} export`);
			}

			return exec_promise.then(() => {
				const resolved = require.resolve('../../middleware.js');
				delete require.cache[resolved];
				delete require.cache[require.resolve('../../core.js')]; // TODO remove this

				return require('get-port')();
			}).then(port => {
				base = `http://localhost:${port}`;

				proc = require('child_process').fork('.sapper/server.js', {
					cwd: process.cwd(),
					env: {
						NODE_ENV: env,
						PORT: port
					}
				});

				let handler;

				proc.on('message', message => {
					if (message.__sapper__) return;
					if (handler) handler(message);
				});

				capture = fn => {
					return new Promise((fulfil, reject) => {
						const captured = [];

						let start = Date.now();

						handler = message => {
							if (message.type === 'ready') {
								fn().then(() => {
									proc.send({
										action: 'end'
									});
								}, reject);
							}

							else if (message.type === 'done') {
								fulfil(captured);
								handler = null;
							}

							else {
								captured.push(message);
							}
						};

						proc.send({
							action: 'start'
						});
					});
				};
			});
		});

		after(() => {
			proc.kill();

			// give a chance to clean up
			return new Promise(fulfil => setTimeout(fulfil, 500));
		});

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

		describe('basic functionality', () => {
			it('serves /', () => {
				return nightmare.goto(base).page.title().then(title => {
					assert.equal(title, 'Great success!');
				});
			});

			it('serves /?', () => {
				return nightmare.goto(`${base}?`).page.title().then(title => {
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
				return capture(() => nightmare.goto(base).init().wait(200))
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
					.wait(100)
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
					.init().wait(300)
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
				return capture(() => nightmare.goto(base).end()).then(requests => {
					const { headers } = requests[0];

					assert.equal(
						headers['content-type'],
						'text/html'
					);

					assert.ok(
						/<\/client\/main.\w+\.js>;rel="preload";as="script", <\/client\/_.\d+.\w+.js>;rel="preload";as="script"/.test(headers['link']),
						headers['link']
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
						assert.ok(allPages.includes(expectedPage),`Could not find page matching ${expectedPage}`);
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
						assert.ok(matched, `Could not find client page matching ${expectedRegex}`);
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
