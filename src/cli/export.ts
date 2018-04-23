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

export async function exporter(export_dir: string, { basepath = '' }) {
	const build_dir = locations.dest();

	export_dir = path.join(export_dir, basepath);

	// Prep output directory
	sander.rimrafSync(export_dir);

	sander.copydirSync('assets').to(export_dir);
	sander.copydirSync(build_dir, 'client').to(export_dir, 'client');

	if (sander.existsSync(build_dir, 'service-worker.js')) {
		sander.copyFileSync(build_dir, 'service-worker.js').to(export_dir, 'service-worker.js');
	}

	if (sander.existsSync(build_dir, 'service-worker.js.map')) {
		sander.copyFileSync(build_dir, 'service-worker.js.map').to(export_dir, 'service-worker.js.map');
	}

	const port = await ports.find(3000);

	const origin = `http://localhost:${port}`;

	const proc = child_process.fork(path.resolve(`${build_dir}/server.js`), [], {
		cwd: process.cwd(),
		env: Object.assign({}, process.env, {
			PORT: port,
			NODE_ENV: 'production',
			SAPPER_DEST: build_dir,
			SAPPER_EXPORT: 'true'
		})
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

		sander.writeFileSync(export_dir, file, body);
	});

	async function handle(url: URL) {
		const r = await fetch(url.href);
		const range = ~~(r.status / 100);

		if (range >= 4) {
			console.log(`${clorox.red(`> Received ${r.status} response when fetching ${url.pathname}`)}`);
			return;
		}

		if (range === 2) {
			if (r.headers.get('Content-Type') === 'text/html') {
				const body = await r.text();
				const $ = cheerio.load(body);
				const urls: URL[] = [];

				const base = new URL($('base').attr('href') || '/', url.href);

				$('a[href]').each((i: number, $a) => {
					const url = new URL($a.attribs.href, base.href);

					if (url.origin === origin && !seen.has(url.pathname)) {
						seen.add(url.pathname);
						urls.push(url);
					}
				});

				for (const url of urls) {
					await handle(url);
				}
			}
		}
	}

	return ports.wait(port)
		.then(() => handle(new URL(`/${basepath}`, origin))) // TODO all static routes
		.then(() => proc.kill());
}
