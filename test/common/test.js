const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Nightmare = require('nightmare');
const walkSync = require('walk-sync');
const rimraf = require('rimraf');
const ports = require('port-authority');
const fetch = require('node-fetch');

Nightmare.action('page', {
	title(done) {
		this.evaluate_now(() => document.querySelector('h1').textContent, done);
	},

	html(done) {
		this.evaluate_now(() => document.documentElement.innerHTML, done);
	},

	text(done) {
		this.evaluate_now(() => document.body.textContent, done);
	}
});

Nightmare.action('init', function(done) {
	this.evaluate_now(() => window.init(), done);
});

Nightmare.action('prefetchRoutes', function(done) {
	this.evaluate_now(() => window.prefetchRoutes(), done);
});

const cli = path.resolve(__dirname, '../../sapper');

const wait = ms => new Promise(f => setTimeout(f, ms));

describe('sapper', function() {
	process.chdir(path.resolve(__dirname, '../app'));

	// clean up after previous test runs
	rimraf.sync('__sapper__');

	this.timeout(process.env.CI ? 30000 : 15000);

	// TODO reinstate dev tests
	// run({
	// 	mode: 'development'
	// });

	run({
		mode: 'production'
	});

	run({
		mode: 'production',
		basepath: '/custom-basepath'
	});
});

function run({ mode, basepath = '' }) {
	describe.skip(`mode=${mode}`, function () {
		let proc;
		let capture;

		let base;
		let captured_basepath;

		const nightmare = new Nightmare();

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

		before(() => {
			const promise = mode === 'production'
				? exec(`node ${cli} build -l`).then(() => ports.find(3000))
				: ports.find(3000).then(port => {
					exec(`node ${cli} dev`);
					return ports.wait(port).then(() => port);
				});

			return promise.then(port => {
				base = `http://localhost:${port}`;
				if (basepath) base += basepath;

				const dir = mode === 'production' ? '__sapper__/build' : '__sapper__/dev';

				if (mode === 'production') {
					assert.ok(fs.existsSync('__sapper__/build/index.js'));
				}

				proc = require('child_process').fork(`${dir}/server/server.js`, {
					cwd: process.cwd(),
					env: {
						NODE_ENV: mode,
						BASEPATH: basepath,
						SAPPER_DEST: dir,
						PORT: port
					}
				});

				let handler;

				proc.on('message', message => {
					if (message.__sapper__) {
						if (message.event === 'basepath') {
							captured_basepath = basepath;
						}
						return;
					}

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
			// give a chance to clean up
			return Promise.all([
				nightmare.end(),
				new Promise(fulfil => {
					proc.on('exit', fulfil);
					proc.kill();
				})
			]);
		});

		describe('basic functionality', () => {
			// it('cancels navigation if subsequent navigation occurs during preload', () => {
			// 	return nightmare
			// 		.goto(base)
			// 		.init()
			// 		.click('a[href="slow-preload"]')
			// 		.wait(100)
			// 		.click('a[href="about"]')
			// 		.wait(100)
			// 		.then(() => nightmare.path())
			// 		.then(path => {
			// 			assert.equal(path, `${basepath}/about`);
			// 			return nightmare.title();
			// 		})
			// 		.then(title => {
			// 			assert.equal(title, 'About');
			// 			return nightmare.evaluate(() => window.fulfil({})).wait(100);
			// 		})
			// 		.then(() => nightmare.path())
			// 		.then(path => {
			// 			assert.equal(path, `${basepath}/about`);
			// 			return nightmare.title();
			// 		})
			// 		.then(title => {
			// 			assert.equal(title, 'About');
			// 		});
			// });

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

			// Ignores are meant for top-level escape.
			// ~> Sapper **should** own the entire {basepath} when designated.
			if (!basepath) {
				it('respects `options.ignore` values (RegExp)', () => {
					return nightmare.goto(`${base}/foobar`)
						.evaluate(() => document.documentElement.textContent)
						.then(text => {
							assert.equal(text, 'foobar');
						});
				});

				it('respects `options.ignore` values (String #1)', () => {
					return nightmare.goto(`${base}/buzz`)
						.evaluate(() => document.documentElement.textContent)
						.then(text => {
							assert.equal(text, 'buzz');
						});
				});

				it('respects `options.ignore` values (String #2)', () => {
					return nightmare.goto(`${base}/fizzer`)
						.evaluate(() => document.documentElement.textContent)
						.then(text => {
							assert.equal(text, 'fizzer');
						});
				});

				it('respects `options.ignore` values (Function)', () => {
					return nightmare.goto(`${base}/hello`)
						.evaluate(() => document.documentElement.textContent)
						.then(text => {
							assert.equal(text, 'hello');
						});
				});
			}

			it('does not attempt client-side navigation to server routes', () => {
				return nightmare.goto(`${base}/blog/how-is-sapper-different-from-next`)
					.init()
					.click(`[href="blog/how-is-sapper-different-from-next.json"]`)
					.wait(200)
					.page.text()
					.then(text => {
						JSON.parse(text);
					});
			});

			it('serializes Set objects returned from preload', () => {
				return nightmare.goto(`${base}/preload-values/set`)
					.page.title()
					.then(title => {
						assert.equal(title, 'true');
						return nightmare.init().page.title();
					})
					.then(title => {
						assert.equal(title, 'true');
					});
			});

			it('bails on custom classes returned from preload', () => {
				return nightmare.goto(`${base}/preload-values/custom-class`)
					.page.title()
					.then(title => {
						assert.equal(title, '42');
						return nightmare.init().page.title();
					})
					.then(title => {
						assert.equal(title, '42');
					});
			});

			it('renders store props', () => {
				return nightmare.goto(`${base}/store`)
					.page.title()
					.then(title => {
						assert.equal(title, 'hello world');
						return nightmare.init().page.title();
					})
					.then(title => {
						assert.equal(title, 'hello world');
					});
			});

			it('sets preloading true when appropriate', () => {
				return nightmare
					.goto(base)
					.init()
					.click('a[href="slow-preload"]')
					.wait(100)
					.evaluate(() => {
						const progress = document.querySelector('progress');
						return !!progress;
					})
					.then(hasProgressIndicator => {
						assert.ok(hasProgressIndicator);
					})
					.then(() => nightmare.evaluate(() => window.fulfil()))
					.then(() => nightmare.evaluate(() => {
						const progress = document.querySelector('progress');
						return !!progress;
					}))
					.then(hasProgressIndicator => {
						assert.ok(!hasProgressIndicator);
					});
			});

			it('emits a basepath', () => {
				assert.equal(captured_basepath, basepath);
			});

			// skipped because Nightmare doesn't seem to focus the <a> correctly
			it.skip('resets the active element after navigation', () => {
				return nightmare
					.goto(base)
					.init()
					.click('a[href="about"]')
					.wait(100)
					.evaluate(() => document.activeElement.nodeName)
					.then(name => {
						assert.equal(name, 'BODY');
					});
			});

			it('replaces %sapper.xxx% tags safely', () => {
				return nightmare
					.goto(`${base}/unsafe-replacement`)
					.init()
					.page.html()
					.then(html => {
						assert.equal(html.indexOf('%sapper'), -1);
					});
			});

			it('only recreates components when necessary', () => {
				return nightmare
					.goto(`${base}/foo/bar/baz`)
					.init()
					.evaluate(() => document.querySelector('#sapper').textContent)
					.then(text => {
						assert.deepEqual(text.split('\n').filter(Boolean), [
							'y: bar 1',
							'z: baz 1',
							'child segment: baz'
						]);

						return nightmare.click(`a`)
							.then(() => wait(100))
							.then(() => {
								return nightmare.evaluate(() => document.querySelector('#sapper').textContent);
							});
					})
					.then(text => {
						assert.deepEqual(text.split('\n').filter(Boolean), [
							'y: bar 1',
							'z: qux 2',
							'child segment: qux'
						]);
					});
			});

			it('uses a fallback index component if none is provided', () => {
				return nightmare.goto(`${base}/missing-index/ok`)
					.page.title()
					.then(title => {
						assert.equal(title, 'it works');
					});
			});

			it('runs preload in root component', () => {
				return nightmare.goto(`${base}/preload-root`)
					.page.title()
					.then(title => {
						assert.equal(title, 'root preload function ran: true');
					});
			});

			it('allows reserved words as route names', () => {
				return nightmare.goto(`${base}/const`).init()
					.page.title()
					.then(title => {
						assert.equal(title, 'reserved words are okay as routes');
					});
			});

			it('accepts value-less query string parameter on server', () => {
				return nightmare.goto(`${base}/echo/page/empty?message`)
					.page.title()
					.then(title => {
						assert.equal(title, 'empty ()');
					});
			});

			it('accepts value-less query string parameter on client', () => {
				return nightmare.goto(base).init()
					.click('a[href="echo/page/empty?message"]')
					.wait(100)
					.page.title()
					.then(title => {
						assert.equal(title, 'empty ()');
					});
			});
		});
	});
}

function exec(cmd) {
	return new Promise((fulfil, reject) => {
		const parts = cmd.trim().split(' ');
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
