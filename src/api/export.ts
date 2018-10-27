import * as child_process from 'child_process';
import * as path from 'path';
import * as sander from 'sander';
import * as url from 'url';
import fetch from 'node-fetch';
import * as ports from 'port-authority';
import clean_html from './utils/clean_html';
import minify_html from './utils/minify_html';
import Deferred from './utils/Deferred';
import { noop } from './utils/noop';

type Opts = {
	build_dir?: string,
	export_dir?: string,
	cwd?: string,
	static?: string,
	basepath?: string,
	timeout?: number | false,
	oninfo?: ({ message }: { message: string }) => void;
	onfile?: ({ file, size, status }: { file: string, size: number, status: number }) => void;
};

function resolve(from: string, to: string) {
	return url.parse(url.resolve(from, to));
}

type URL = url.UrlWithStringQuery;

export { _export as export };

async function _export({
	cwd,
	static: static_files = 'static',
	build_dir = '__sapper__/build',
	export_dir = '__sapper__/export',
	basepath = '',
	timeout = 5000,
	oninfo = noop,
	onfile = noop
}: Opts = {}) {
	basepath = basepath.replace(/^\//, '')

	cwd = path.resolve(cwd);
	static_files = path.resolve(cwd, static_files);
	build_dir = path.resolve(cwd, build_dir);
	export_dir = path.resolve(cwd, export_dir, basepath);

	// Prep output directory
	sander.rimrafSync(export_dir);

	sander.copydirSync(static_files).to(export_dir);
	sander.copydirSync(build_dir, 'client').to(export_dir, 'client');

	if (sander.existsSync(build_dir, 'service-worker.js')) {
		sander.copyFileSync(build_dir, 'service-worker.js').to(export_dir, 'service-worker.js');
	}

	if (sander.existsSync(build_dir, 'service-worker.js.map')) {
		sander.copyFileSync(build_dir, 'service-worker.js.map').to(export_dir, 'service-worker.js.map');
	}

	const port = await ports.find(3000);

	const protocol = 'http:';
	const host = `localhost:${port}`;
	const origin = `${protocol}//${host}`;

	const root = resolve(origin, basepath);
	if (!root.href.endsWith('/')) root.href += '/';

	oninfo({
		message: `Crawling ${root.href}`
	});

	const proc = child_process.fork(path.resolve(`${build_dir}/server/server.js`), [], {
		cwd,
		env: Object.assign({
			PORT: port,
			NODE_ENV: 'production',
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

		onfile({
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
		const the_timeout = setTimeout(() => {
			timeout_deferred.reject(new Error(`Timed out waiting for ${url.href}`));
		}, timeout);

		const r = await Promise.race([
			fetch(url.href, {
				redirect: 'manual'
			}),
			timeout_deferred.promise
		]);

		clearTimeout(the_timeout); // prevent it hanging at the end

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
	const match = /href\s*=\s*(?:"(.*?)"|'(.+?)'|([^\s>]+))/.exec(attrs);
	return match[1] || match[2] || match[3];
}