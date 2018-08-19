import * as child_process from 'child_process';
import * as path from 'path';
import * as sander from 'sander';
import URL from 'url-parse';
import fetch from 'node-fetch';
import * as ports from 'port-authority';
import { EventEmitter } from 'events';
import clean_html from './utils/clean_html';
import minify_html from './utils/minify_html';
import Deferred from './utils/Deferred';
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
	const root = new URL(basepath || '', origin);

	emitter.emit('info', {
		message: `Crawling ${root.href}`
	});

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
	const deferreds = new Map();

	function get_deferred(pathname: string) {
		pathname = pathname.replace(root.pathname, '');

		if (!deferreds.has(pathname)) {
			deferreds.set(pathname, new Deferred());
		}

		return deferreds.get(pathname);
	}

	proc.on('message', message => {
		if (!message.__sapper__ || message.event !== 'file') return;

		const pathname = new URL(message.url, origin).pathname;
		let file = pathname.slice(1);
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
			size: body.length,
			status: message.status
		});

		sander.writeFileSync(export_dir, file, body);

		get_deferred(pathname).fulfil();
	});

	async function handle(url: URL) {
		const pathname = (url.pathname.replace(root.pathname, '') || '/');

		if (seen.has(pathname)) return;
		seen.add(pathname);

		const deferred = get_deferred(pathname);

		const r = await fetch(url.href);
		const range = ~~(r.status / 100);

		if (range === 2) {
			if (r.headers.get('Content-Type') === 'text/html') {
				const body = await r.text();
				const urls: URL[] = [];

				const cleaned = clean_html(body);

				const base_match = /<base ([\s\S]+?)>/m.exec(cleaned);
				const base_href = base_match && get_href(base_match[1]);
				const base = new URL(base_href || '/', url.href);

				let match;
				let pattern = /<a ([\s\S]+?)>/gm;

				while (match = pattern.exec(cleaned)) {
					const attrs = match[1];
					const href = get_href(attrs);

					if (href) {
						const url = new URL(href, base.href);
						if (url.origin === origin) urls.push(url);
					}
				}

				await Promise.all(urls.map(handle));
			}
		}

		await deferred.promise;
	}

	return ports.wait(port)
		.then(() => {
			// TODO all static routes
			return handle(root);
		})
		.then(() => proc.kill());
}

function get_href(attrs: string) {
	const match = /href\s*=\s*(?:"(.+?)"|'(.+?)'|([^\s>]+))/.exec(attrs);
	return match[1] || match[2] || match[3];
}