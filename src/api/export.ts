import * as child_process from 'child_process';
import * as path from 'path';
import * as sander from 'sander';
import * as url from 'url';
import fetch from 'node-fetch';
import * as ports from 'port-authority';
import { EventEmitter } from 'events';
import clean_html from './utils/clean_html';
import minify_html from './utils/minify_html';
import Deferred from './utils/Deferred';
import * as events from './interfaces';

type Opts = {
	build: string,
	dest: string,
	static: string,
	basepath?: string,
	timeout: number | false
};

export function exporter(opts: Opts) {
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

function resolve(from: string, to: string) {
	return url.parse(url.resolve(from, to));
}

type URL = url.UrlWithStringQuery;

async function execute(emitter: EventEmitter, opts: Opts) {
	const export_dir = path.join(opts.dest, opts.basepath);

	// Prep output directory
	sander.rimrafSync(export_dir);

	sander.copydirSync(opts.static).to(export_dir);
	sander.copydirSync(opts.build, 'client').to(export_dir, 'client');

	if (sander.existsSync(opts.build, 'service-worker.js')) {
		sander.copyFileSync(opts.build, 'service-worker.js').to(export_dir, 'service-worker.js');
	}

	if (sander.existsSync(opts.build, 'service-worker.js.map')) {
		sander.copyFileSync(opts.build, 'service-worker.js.map').to(export_dir, 'service-worker.js.map');
	}

	const port = await ports.find(3000);

	const protocol = 'http:';
	const host = `localhost:${port}`;
	const origin = `${protocol}//${host}`;

	const root = resolve(origin, opts.basepath || '');
	if (!root.href.endsWith('/')) root.href += '/';

	emitter.emit('info', {
		message: `Crawling ${root.href}`
	});

	const proc = child_process.fork(path.resolve(`${opts.build}/server.js`), [], {
		cwd: process.cwd(),
		env: Object.assign({
			PORT: port,
			NODE_ENV: 'production',
			SAPPER_DEST: opts.build,
			SAPPER_EXPORT: 'true'
		}, process.env)
	});

	const seen = new Set();
	const saved = new Set();

	function save(path: string, status: number, type: string, body: string) {
		const { pathname } = resolve(origin, path);
		let file = decodeURIComponent(pathname.slice(1));

		if (saved.has(file)) return;
		saved.add(file);

		const is_html = type === 'text/html';

		if (is_html) {
			file = file === '' ? 'index.html' : `${file}/index.html`;
			body = minify_html(body);
		}

		emitter.emit('file', <events.FileEvent>{
			file,
			size: body.length,
			status
		});

		sander.writeFileSync(export_dir, file, body);
	}

	proc.on('message', message => {
		if (!message.__sapper__ || message.event !== 'file') return;
		save(message.url, message.status, message.type, message.body);
	});

	async function handle(url: URL) {
		const pathname = (url.pathname.replace(root.pathname, '') || '/');

		if (seen.has(pathname)) return;
		seen.add(pathname);

		const timeout_deferred = new Deferred();
		const timeout = setTimeout(() => {
			timeout_deferred.reject(new Error(`Timed out waiting for ${url.href}`));
		}, opts.timeout);

		const r = await Promise.race([
			fetch(url.href, {
				redirect: 'manual'
			}),
			timeout_deferred.promise
		]);

		clearTimeout(timeout); // prevent it hanging at the end

		let type = r.headers.get('Content-Type');
		let body = await r.text();

		const range = ~~(r.status / 100);

		if (range === 2) {
			if (type === 'text/html') {
				const urls: URL[] = [];

				const cleaned = clean_html(body);

				const base_match = /<base ([\s\S]+?)>/m.exec(cleaned);
				const base_href = base_match && get_href(base_match[1]);
				const base = resolve(url.href, base_href);

				let match;
				let pattern = /<a ([\s\S]+?)>/gm;

				while (match = pattern.exec(cleaned)) {
					const attrs = match[1];
					const href = get_href(attrs);

					if (href) {
						const url = resolve(base.href, href);

						if (url.protocol === protocol && url.host === host) {
							urls.push(url);
						}
					}
				}

				await Promise.all(urls.map(handle));
			}
		}

		if (range === 3) {
			const location = r.headers.get('Location');

			type = 'text/html';
			body = `<script>window.location.href = "${location.replace(origin, '')}"</script>`;

			await handle(resolve(root.href, location));
		}

		save(pathname, r.status, type, body);
	}

	return ports.wait(port)
		.then(() => handle(root))
		.then(() => proc.kill())
		.catch(err => {
			proc.kill();
			throw err;
		});
}

function get_href(attrs: string) {
	const match = /href\s*=\s*(?:"(.+?)"|'(.+?)'|([^\s>]+))/.exec(attrs);
	return match[1] || match[2] || match[3];
}