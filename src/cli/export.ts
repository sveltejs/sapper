import * as child_process from 'child_process';
import * as path from 'path';
import * as sander from 'sander';
import express from 'express';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import URL from 'url-parse';
import { create_assets } from 'sapper/core.js';

const { OUTPUT_DIR = 'dist' } = process.env;

const app = express();

function read_json(file: string) {
	return JSON.parse(sander.readFileSync(file, { encoding: 'utf-8' }));
}

export default async function exporter({ src, dest }) { // TODO dest is a terrible name in this context
	// Prep output directory
	sander.rimrafSync(OUTPUT_DIR);

	sander.copydirSync('assets').to(OUTPUT_DIR);
	sander.copydirSync(dest, 'client').to(OUTPUT_DIR, 'client');

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

	const port = await require('get-port')(3000);

	const origin = `http://localhost:${port}`;

	global.fetch = (url, opts) => {
		if (url[0] === '/') {
			url = `http://localhost:${port}${url}`;

			return fetch(url, opts)
				.then(r => {
					save(r);
					return r;
				});
		}

		return fetch(url, opts);
	};

	const proc = child_process.fork(path.resolve(`${dest}/server.js`), [], {
		cwd: process.cwd(),
		env: {
			PORT: port,
			NODE_ENV: 'production'
		}
	});

	await require('wait-port')({ port });

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
		.then(() => proc.kill());
}