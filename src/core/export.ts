import * as path from 'path';
import * as sander from 'sander';
import express from 'express';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import URL from 'url-parse';
import create_assets from './create_assets.js';
// import middleware from '../middleware/index.js';

const { PORT = 3000, OUTPUT_DIR = 'dist' } = process.env;

const origin = `http://localhost:${PORT}`;

const app = express();

function read_json(file) {
	return JSON.parse(sander.readFileSync(file, { encoding: 'utf-8' }));
}

export default function exporter({ src, dest }) { // TODO dest is a terrible name in this context
	// Prep output directory
	sander.rimrafSync(OUTPUT_DIR);

	const { service_worker } = create_assets({
		src, dest,
		dev: false,
		client_info: read_json(path.join(dest, 'stats.client.json')),
		server_info: read_json(path.join(dest, 'stats.server.json'))
	});

	sander.copydirSync('assets').to(OUTPUT_DIR);
	sander.copydirSync(dest, 'client').to(OUTPUT_DIR, 'client');
	sander.writeFileSync(OUTPUT_DIR, 'service-worker.js', service_worker);

	// Intercept server route fetches
	function save(res) {
		res = res.clone();

		return res.text().then(body => {
			const { pathname } = new URL(res.url);
			let dest = OUTPUT_DIR + pathname;

			const type = res.headers.get('Content-Type');
			if (type && type.startsWith('text/html')) dest += '/index.html';

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

	const middleware = require('./middleware')(); // TODO this is filthy
	app.use(middleware);
	const server = app.listen(PORT);

	const seen = new Set();

	function handle(url) {
		if (url.origin !== origin) return;

		if (seen.has(url.pathname)) return;
		seen.add(url.pathname);

		return fetch(url.href)
			.then(r => {
				save(r);

				if (r.headers.get('Content-Type') === 'text/html') {
					return r.text().then(body => {
						const $ = cheerio.load(body);
						const hrefs = [];

						$('a[href]').each((i, $a) => {
							hrefs.push($a.attribs.href);
						});

						return hrefs.reduce((promise, href) => {
							return promise.then(() => handle(new URL(href, url.href)));
						}, Promise.resolve());
					});
				}
			})
			.catch(err => {
				console.error(`Error rendering ${url.pathname}: ${err.message}`);
			});
	}

	return handle(new URL(origin)) // TODO all static routes
		.then(() => {
			server.close();
			middleware.close();
		});
}