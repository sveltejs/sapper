import * as child_process from 'child_process';
import * as path from 'path';
import * as sander from 'sander';
import cheerio from 'cheerio';
import URL from 'url-parse';
import fetch from 'node-fetch';
import * as ports from 'port-authority';
import { EventEmitter } from 'events';
import { minify_html } from './utils/minify_html';
import { locations } from '../config';
import * as events from './interfaces';

export function exporter(opts: {}) {
	const emitter = new EventEmitter();

	execute(emitter, opts).then(
		() => {
			emitter.emit('done', <events.DoneEvent>{}); // TODO do we need to pass back any info?
		},
		error => {
			emitter.emit('error', <events.ErrorEvent>{
				error
			});
		}
	);

	return emitter;
}

async function execute(emitter: EventEmitter, {
	build = 'build',
	dest = 'export',
	basepath = ''
} = {}) {
	const export_dir = path.join(dest, basepath);

	// Prep output directory
	sander.rimrafSync(export_dir);

	sander.copydirSync('assets').to(export_dir);
	sander.copydirSync(build, 'client').to(export_dir, 'client');

	if (sander.existsSync(build, 'service-worker.js')) {
		sander.copyFileSync(build, 'service-worker.js').to(export_dir, 'service-worker.js');
	}

	if (sander.existsSync(build, 'service-worker.js.map')) {
		sander.copyFileSync(build, 'service-worker.js.map').to(export_dir, 'service-worker.js.map');
	}

	const port = await ports.find(3000);

	const origin = `http://localhost:${port}`;

	const proc = child_process.fork(path.resolve(`${build}/server.js`), [], {
		cwd: process.cwd(),
		env: Object.assign({
			PORT: port,
			NODE_ENV: 'production',
			SAPPER_DEST: build,
			SAPPER_EXPORT: 'true'
		}, process.env)
	});

	const seen = new Set();
	const saved = new Set();

	proc.on('message', message => {
		if (!message.__sapper__ || message.event !== 'file') return;

		let file = new URL(message.url, origin).pathname.slice(1);
		let { body } = message;

		if (saved.has(file)) return;
		saved.add(file);

		const is_html = message.type === 'text/html';

		if (is_html) {
			file = file === '' ? 'index.html' : `${file}/index.html`;
			body = minify_html(body);
		}

		emitter.emit('file', <events.FileEvent>{
			file,
			size: body.length
		});

		sander.writeFileSync(export_dir, file, body);
	});

	async function handle(url: URL) {
		const r = await fetch(url.href);
		const range = ~~(r.status / 100);

		if (range >= 4) {
			emitter.emit('failure', <events.FailureEvent>{
				status: r.status,
				pathname: url.pathname
			});
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

				await Promise.all(urls.map(handle));
			}
		}
	}

	return ports.wait(port)
		.then(() => handle(new URL(`/${basepath}`, origin))) // TODO all static routes
		.then(() => proc.kill());
}
