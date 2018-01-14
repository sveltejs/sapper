const sander = require('sander');
const app = require('express')();
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const sapper = require('../index.js');

const { PORT = 3000, OUTPUT_DIR = 'dist' } = process.env;
const { dest } = require('../config.js');

const prefix = `http://localhost:${PORT}`;

module.exports = function() {
	// Prep output directory
	sander.rimrafSync(OUTPUT_DIR);

	sander.copydirSync('assets').to(OUTPUT_DIR);
	sander.copydirSync(`${dest}/client`).to(`${OUTPUT_DIR}/client`);
	sander.copyFileSync(`${dest}/service-worker.js`).to(`${OUTPUT_DIR}/service-worker.js`);

	// Intercept server route fetches
	global.fetch = (url, opts) => {
		if (url[0] === '/') {
			const dest = OUTPUT_DIR + url;
			url = `http://localhost:${PORT}${url}`;

			return fetch(url, opts)
				.then(r => {
					r.clone().text().then(body => {
						sander.writeFileSync(dest, body);
					});
					return r;
				});
		}

		return fetch(url, opts);
	};

	app.use(sapper());
	const server = app.listen(PORT);

	const seen = new Set();

	function handle(pathname) {
		if (pathname[0] !== '/') return;

		if (seen.has(pathname)) return;
		seen.add(pathname);

		return fetch(`${prefix}${pathname}`)
			.then(r => r.text())
			.then(body => {
				const dest = OUTPUT_DIR + pathname + '/index.html';
				sander.writeFileSync(dest, body);

				const $ = cheerio.load(body);
				const hrefs = [];

				$('a[href]').each((i, $a) => {
					hrefs.push($a.attribs.href);
				});

				return hrefs.reduce((promise, href) => promise.then(() => handle(href)), Promise.resolve());
			})
			.catch(err => {
				console.error(`Error rendering ${pathname}: ${err.message}`);
			});
	}

	return handle('/') // TODO all static routes
		.then(() => server.close());
};
