import * as child_process from 'child_process';
import * as path from 'path';
import * as sander from 'sander';
import * as clorox from 'clorox';
import cheerio from 'cheerio';
import URL from 'url-parse';
import fetch from 'node-fetch';
import * as ports from 'port-authority';
import prettyBytes from 'pretty-bytes';
import { minify_html } from './utils/minify_html';
import { locations } from '../config';

export async function exporter(export_dir: string) {
	const build_dir = locations.dest();

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

		let file = new URL(message.url, origin).pathname.slice(1);
		let { body } = message;

		if (saved.has(file)) return;
		saved.add(file);

		const is_html = message.type === 'text/html';

		if (is_html) {
			file = file === '' ? 'index.html' : `${file}/index.html`;
			body = minify_html(body);
		}

		console.log(`${clorox.bold.cyan(file)} ${clorox.gray(`(${prettyBytes(body.length)})`)}`);

		sander.writeFileSync(`${export_dir}/${file}`, body);
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
				console.log(`${clorox.red(`> Error rendering ${url.pathname}: ${err.message}`)}`);
			});
	}

	return ports.wait(port)
		.then(() => handle(new URL(origin))) // TODO all static routes
		.then(() => proc.kill());
}