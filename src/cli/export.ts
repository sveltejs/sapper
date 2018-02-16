import * as child_process from 'child_process';
import * as path from 'path';
import * as sander from 'sander';
import express from 'express';
import cheerio from 'cheerio';
import URL from 'url-parse';

const { OUTPUT_DIR = 'dist' } = process.env;

const app = express();

function read_json(file: string) {
	return JSON.parse(sander.readFileSync(file, { encoding: 'utf-8' }));
}

export default async function exporter(dir: string) { // dir === '.sapper'
	// Prep output directory
	sander.rimrafSync(OUTPUT_DIR);

	sander.copydirSync('assets').to(OUTPUT_DIR);
	sander.copydirSync(dir, 'client').to(OUTPUT_DIR, 'client');
	sander.copyFileSync(dir, 'service-worker.js').to(OUTPUT_DIR, 'service-worker.js');

	const port = await require('get-port')(3000);

	const origin = `http://localhost:${port}`;

	const proc = child_process.fork(path.resolve(`${dir}/server.js`), [], {
		cwd: process.cwd(),
		env: {
			PORT: port,
			NODE_ENV: 'production',
			SAPPER_EXPORT: 'true'
		}
	});

	const seen = new Set();
	const saved = new Set();

	proc.on('message', message => {
		if (!message.__sapper__) return;

		const url = new URL(message.url, origin);

		if (saved.has(url.pathname)) return;
		saved.add(url.pathname);

		if (message.type === 'text/html') {
			const dest = `${OUTPUT_DIR}/${url.pathname}/index.html`;
			sander.writeFileSync(dest, message.body);
		} else {
			const dest = `${OUTPUT_DIR}/${url.pathname}`;
			sander.writeFileSync(dest, message.body);
		}
	});

	await require('wait-port')({ port });

	function handle(url: URL) {
		if (url.origin !== origin) return;

		if (seen.has(url.pathname)) return;
		seen.add(url.pathname);

		return fetch(url.href)
			.then(r => {
				if (r.headers.get('Content-Type') === 'text/html') {
					return r.text().then((body: string) => {
						const $ = cheerio.load(body);
						const hrefs: string[] = [];

						$('a[href]').each((i: number, $a) => {
							hrefs.push($a.attribs.href);
						});

						return hrefs.reduce((promise, href) => {
							return promise.then(() => handle(new URL(href, url.href)));
						}, Promise.resolve());
					});
				}
			})
			.catch((err: Error) => {
				console.error(`Error rendering ${url.pathname}: ${err.message}`);
			});
	}

	return handle(new URL(origin)) // TODO all static routes
		.then(() => proc.kill());
}