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

type Opts = {
	build: string,
	dest: string,
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

async function execute(emitter: EventEmitter, opts: Opts) {
	const export_dir = path.join(opts.dest, opts.basepath);

	// Prep output directory
	sander.rimrafSync(export_dir);

	sander.copydirSync('assets').to(export_dir);
	sander.copydirSync(opts.build, 'client').to(export_dir, 'client');

	if (sander.existsSync(opts.build, 'service-worker.js')) {
		sander.copyFileSync(opts.build, 'service-worker.js').to(export_dir, 'service-worker.js');
	}

	if (sander.existsSync(opts.build, 'service-worker.js.map')) {
		sander.copyFileSync(opts.build, 'service-worker.js.map').to(export_dir, 'service-worker.js.map');
	}

	const port = await ports.find(3000);

	const origin = `http://localhost:${port}`;
	const root = new URL(opts.basepath || '', origin);

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

		const timeout_deferred = new Deferred();
		const timeout = setTimeout(() => {
			timeout_deferred.reject(new Error(`Timed out waiting for ${url.href}`));
		}, opts.timeout);

		const r = await Promise.race([
			fetch(url.href),
			timeout_deferred.promise
		]);

		clearTimeout(timeout); // prevent it hanging at the end

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