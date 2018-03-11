import * as child_process from 'child_process';
import * as path from 'path';
import * as sander from 'sander';
import cheerio from 'cheerio';
import URL from 'url-parse';
import fetch from 'node-fetch';
import * as ports from 'port-authority';
import { dest } from '../config';

export async function exporter(export_dir: string) {
	const build_dir = dest();

	// Prep output directory
	sander.rimrafSync(export_dir);

	sander.copydirSync('assets').to(export_dir);
	sander.copydirSync(build_dir, 'client').to(export_dir, 'client');

	if (sander.existsSync(build_dir, 'service-worker.js')) {
		sander.copyFileSync(build_dir, 'service-worker.js').to(export_dir, 'service-worker.js');
	}

	const port = await ports.find(3000);

	const origin = `http://localhost:${port}`;

	const proc = child_process.fork(path.resolve(`${build_dir}/server.js`), [], {
		cwd: process.cwd(),
		env: {
			PORT: port,
			NODE_ENV: 'production',
			SAPPER_DEST: build_dir,
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
			const file = `${export_dir}/${url.pathname}/index.html`;
			sander.writeFileSync(file, message.body);
		} else {
			const file = `${export_dir}/${url.pathname}`;
			sander.writeFileSync(file, message.body);
		}
	});

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

	return ports.wait(port)
		.then(() => handle(new URL(origin))) // TODO all static routes
		.then(() => proc.kill());
}