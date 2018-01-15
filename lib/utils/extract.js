const sander = require('sander');
const app = require('express')();
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const { URL } = require('url');
const sapper = require('../index.js');

const { PORT = 3000, OUTPUT_DIR = 'dist' } = process.env;
const { dest } = require('../config.js');

const origin = `http://localhost:${PORT}`;

module.exports = function() {
	// Prep output directory
	sander.rimrafSync(OUTPUT_DIR);

	sander.copydirSync('assets').to(OUTPUT_DIR);
	sander.copydirSync(`${dest}/client`).to(`${OUTPUT_DIR}/client`);
	sander.copyFileSync(`${dest}/service-worker.js`).to(`${OUTPUT_DIR}/service-worker.js`);

	// Intercept server route fetches
	function save(res) {
		res = res.clone();

		return res.text().then(body => {
			const { pathname } = new URL(res.url);
			let dest = OUTPUT_DIR + pathname;

			const type = res.headers.get('Content-Type');
			if (type.startsWith('text/html;')) dest += '/index.html';

			sander.writeFileSync(dest, body);

			return body;
		});
	}

	global.fetch = (url, opts) => {
		if (url[0] === '/') {
			url = `http://localhost:${PORT}${url}`;

			return fetch(url, opts)
				.then(r => {
					save(r);
					return r;
				});
		}

		return fetch(url, opts);
	};

	app.use(sapper());
	const server = app.listen(PORT);

	const seen = new Set();

	function handle(url) {
		if (url.origin !== origin) return;

		if (seen.has(url.pathname)) return;
		seen.add(url.pathname);

		return fetch(url.href)
			.then(r => {
				save(r);
				return r.text();
			})
			.then(body => {
				const $ = cheerio.load(body);
				const hrefs = [];

				$('a[href]').each((i, $a) => {
					hrefs.push($a.attribs.href);
				});

				return hrefs.reduce((promise, href) => {
					return promise.then(() => handle(new URL(href, url.href)));
				}, Promise.resolve());
			})
			.catch(err => {
				console.error(`Error rendering ${url.pathname}: ${err.message}`);
			});
	}

	return handle(new URL(origin)) // TODO all static routes
		.then(() => server.close());
};
