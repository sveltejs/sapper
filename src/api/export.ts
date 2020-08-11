import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { promisify } from 'util';
import fetch from 'node-fetch';
import * as ports from 'port-authority';
import { exportQueue, FetchOpts, FetchRet } from './utils/export_queue';
import clean_html from './utils/clean_html';
import minify_html from './utils/minify_html';
import Deferred from './utils/Deferred';
import { noop } from './utils/noop';
import { parse as parseLinkHeader } from 'http-link-header';
import { rimraf, copy, mkdirp } from './utils/fs_utils';

const writeFile = promisify(fs.writeFile);

type Opts = {
	build_dir?: string;
	export_dir?: string;
	cwd?: string;
	static?: string;
	basepath?: string;
	host_header?: string;
	timeout?: number | false;
	concurrent?: number;
	oninfo?: ({ message }: { message: string }) => void;
	onfile?: ({ file, size, status }: { file: string, size: number, status: number }) => void;
	entry?: string;
};

type Ref = {
	uri: string;
	rel: string;
	as: string;
};

type URL = url.UrlWithStringQuery;

function resolve(from: string, to: string) {
	return url.parse(url.resolve(from, to));
}

function cleanPath(path: string) {
	return path.replace(/^\/|\/$|\/*index(.html)*$|.html$/g, '');
}

function get_href(attrs: string) {
	const match = /href\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs);
	return match && (match[1] || match[2] || match[3]);
}

export { _export as export };

async function _export({
	cwd,
	static: static_files = 'static',
	build_dir = '__sapper__/build',
	export_dir = '__sapper__/export',
	basepath = '',
	host_header,
	timeout = 5000,
	concurrent = 8,
	oninfo = noop,
	onfile = noop,
	entry = '/'
}: Opts = {}) {
	basepath = basepath.replace(/^\//, '')

	cwd = path.resolve(cwd);
	static_files = path.resolve(cwd, static_files);
	build_dir = path.resolve(cwd, build_dir);
	export_dir = path.resolve(cwd, export_dir, basepath);

	// Prep output directory
	rimraf(export_dir);

	copy(static_files, export_dir);
	copy(path.join(build_dir, 'client'), path.join(export_dir, 'client'));
	copy(path.join(build_dir, 'service-worker.js'), path.join(export_dir, 'service-worker.js'));
	copy(path.join(build_dir, 'service-worker.js.map'), path.join(export_dir, 'service-worker.js.map'));

	const defaultPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
	const port = await ports.find(defaultPort);

	const protocol = 'http:';
	const host = `localhost:${port}`;
	const origin = `${protocol}//${host}`;

	const root = resolve(origin, basepath);
	if (!root.href.endsWith('/')) root.href += '/';

	const entryPoints = entry.split(' ').map(entryPoint => {
		const entry = resolve(origin, `${basepath}/${cleanPath(entryPoint)}`);
		if (!entry.href.endsWith('/')) entry.href += '/';

		return entry;
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

	function save(url: string, status: number, type: string, body: string) {
		const { pathname } = resolve(origin, url);
		let file = decodeURIComponent(pathname.slice(1));

		if (saved.has(file)) return;
		saved.add(file);

		const is_html = type === 'text/html';

		if (is_html) {
			if (!file.endsWith('.html')) {
				file = file === '' ? 'index.html' : `${file}/index.html`;
			}
			body = minify_html(body);
		}

		onfile({
			file,
			size: body.length,
			status
		});

		const export_file = path.join(export_dir, file);
		if (fs.existsSync(export_file)) return;
		mkdirp(path.dirname(export_file));

		return writeFile(export_file, body);
	}

	function handle(url: URL, fetchOpts: FetchOpts, addCallback: Function) {
		let pathname = url.pathname;
		if (pathname !== '/service-worker-index.html') {
			pathname = pathname.replace(fetchOpts.root.pathname, '') || '/';
		}

		if (seen.has(pathname)) return;

		seen.add(pathname);
		addCallback(url);
	}

	async function handleFetch(url: URL, { timeout, host, host_header }: FetchOpts) {
		const href = url.href;
		const timeout_deferred = new Deferred();
		const the_timeout = setTimeout(() => {
			timeout_deferred.reject(new Error(`Timed out waiting for ${href}`));
		}, timeout);

		const r = await Promise.race([
			fetch(href, {
				headers: { host: host_header || host },
				redirect: 'manual'
			}),
			timeout_deferred.promise
		]);

		clearTimeout(the_timeout); // prevent it hanging at the end

		return {
			response: r,
			url,
		};
	}

	async function handleResponse(fetched: Promise<FetchRet>, fetchOpts: FetchOpts) {
		const { response, url } = await fetched;
		const { protocol, host, root } = fetchOpts;
		let pathname = url.pathname;

		if (pathname !== '/service-worker-index.html') {
			pathname = pathname.replace(root.pathname, '') || '/';
		}

		let type = response.headers.get('Content-Type');

		let body = await response.text();

		const range = ~~(response.status / 100);

		if (range === 2 && type === 'text/html') {
			// parse link rel=preload headers and embed them in the HTML
			const link = parseLinkHeader(response.headers.get('Link') || '');
			link.refs.forEach((ref: Ref) => {
				if (ref.rel === 'preload') {
					body = body.replace('</head>',
						`<link rel="preload" as=${JSON.stringify(ref.as)} href=${JSON.stringify(ref.uri)}></head>`);
				}
			});

			if (pathname !== '/service-worker-index.html') {
				const cleaned = clean_html(body);

				const base_match = /<base ([\s\S]+?)>/m.exec(cleaned);
				const base_href = base_match && get_href(base_match[1]);
				const base = resolve(url.href, base_href);

				let match;
				const pattern = /<a ([\s\S]+?)>/gm;

				while (match = pattern.exec(cleaned)) {
					const attrs = match[1];
					const href = get_href(attrs);

					if (href) {
						const url = resolve(base.href, href);

						if (url.protocol === protocol && url.host === host) {
							handle(url, fetchOpts, queue.add);
						}
					}
				}
			}
		}

		if (range === 3) {
			const location = response.headers.get('Location');

			type = 'text/html';
			body = `<script>window.location.href = "${location.replace(origin, '')}"</script>`;

			handle(resolve(root.href, location), fetchOpts, queue.add);
		}

		return save(pathname, response.status, type, body);
	}

	const fetchOpts = {
		timeout: timeout === false ? 0 : timeout,
		host,
		host_header,
		protocol,
		root,
	};

	const queue = exportQueue({
		concurrent,
		seen,
		saved,
		fetchOpts,
		handleFetch,
		handleResponse,
		callbacks: {
			onDone: () => {},
		},
	});

	proc.on('message', message => {
		if (!message.__sapper__ || message.event !== 'file') return;
		queue.addSave(save(message.url, message.status, message.type, message.body));
	});

	return new Promise(async (res, rej) => {
		queue.setCallback('onDone', () => {
			proc.kill();
			res();
		});

		try {
			await ports.wait(port);

			for (const entryPoint of entryPoints) {
				oninfo({
					message: `Crawling ${entryPoint.href}`
				});
				handle(entryPoint, fetchOpts, queue.add);
			}

			const workerUrl = resolve(root.href, 'service-worker-index.html');
			handle(workerUrl, fetchOpts, queue.add);
		} catch (err) {
			proc.kill();
			rej(err);
		}
	});
}
