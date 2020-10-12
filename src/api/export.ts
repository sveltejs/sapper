import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as urllib from 'url';
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

type URL = urllib.UrlWithStringQuery;

function resolve(from: string, to: string) {
	return urllib.parse(urllib.resolve(from, to));
}

function cleanPath(p: string) {
	return p.replace(/^\/|\/$|\/*index(.html)*$|.html$/g, '');
}

function get_href(attrs: string) {
	const match = /href\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs);
	return match && (match[1] || match[2] || match[3]);
}

function get_src(attrs: string) {
	const match = /src\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs);
	return match && (match[1] || match[2] || match[3]);
}

export function get_srcset_urls(attrs: string) {
	const results: string[] = [];
	// Note that the srcset allows any ASCII whitespace, including newlines.
	const match = /srcset\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/s.exec(attrs);
	if (match) {
		const attr_content = match[1] || match[2] || match[3];
		// Parse the content of the srcset attribute.
		// The regexp is modelled after the srcset specs (https://html.spec.whatwg.org/multipage/images.html#srcset-attribute)
		// and should cover most reasonable cases.
		const regex = /\s*([^\s,]\S+[^\s,])\s*((?:\d+w)|(?:-?\d+(?:\.\d+)?(?:[eE]-?\d+)?x))?/gm;
		let sub_matches;
		while (sub_matches = regex.exec(attr_content)) {
			results.push(sub_matches[1]);
		}
	}
	return results;
}

export { _export as export };

async function _export({
	cwd,
	static: static_files = 'static',
	build_dir = '__sapper__/build',
	export_dir = '__sapper__/export',
	basepath = '',
	host_header = undefined,
	timeout = 5000,
	concurrent = 8,
	oninfo = noop,
	onfile = noop,
	entry = '/'
}: Opts = {}) {
	basepath = basepath.replace(/^\//, '');

	cwd = path.resolve(cwd);
	static_files = path.resolve(cwd, static_files);
	build_dir = path.resolve(cwd, build_dir);
	export_dir = path.resolve(cwd, export_dir, basepath);

	// Prep output directory
	rimraf(export_dir);

	copy(static_files, export_dir);
	copy(path.join(build_dir, 'client'), path.join(export_dir, 'client'));

	const has_serviceworker = fs.existsSync(path.join(build_dir, 'service-worker.js'));
	if (has_serviceworker) {
		copy(path.join(build_dir, 'service-worker.js'), path.join(export_dir, 'service-worker.js'));
		copy(path.join(build_dir, 'service-worker.js.map'), path.join(export_dir, 'service-worker.js.map'));
	}

	const defaultPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
	const port = await ports.find(defaultPort);

	const protocol = 'http:';
	const host = `localhost:${port}`;
	const origin = `${protocol}//${host}`;

	const root = resolve(origin, basepath);
	if (!root.href.endsWith('/')) root.href += '/';

	const entryPoints = entry.split(' ').map(entryPoint => {
		const resolved = resolve(origin, `${basepath}/${cleanPath(entryPoint)}`);
		if (!resolved.href.endsWith('/')) resolved.href += '/';

		return resolved;
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

	function save(url: string, status: number, type: string, body: string | ArrayBuffer) {
		const { pathname } = resolve(origin, url);
		let file = decodeURIComponent(pathname.slice(1));

		if (saved.has(file)) return;
		saved.add(file);

		const is_html = type === 'text/html';

		if (is_html) {
			if (!file.endsWith('.html')) {
				file = file === '' ? 'index.html' : `${file}/index.html`;
			}

			if (typeof body === 'string') {
				body = minify_html(body);
			} else {
				oninfo({ message: `Content of ${url} has content-type text/html but the content was received as a binary buffer. The HTML will not be minified.` });
			}
		}

		const buffer = Buffer.from(body);

		onfile({
			file,
			size: buffer.byteLength,
			status
		});

		const export_file = path.join(export_dir, file);
		if (fs.existsSync(export_file)) return;
		mkdirp(path.dirname(export_file));

		return writeFile(export_file, buffer);
	}

	function handle(url: URL, fetchOpts: FetchOpts, addCallback: (url: URL) => void) {
		let pathname = url.pathname;
		if (pathname !== '/service-worker-index.html') {
			pathname = pathname.replace(fetchOpts.root.pathname, '') || '/';
		}

		if (seen.has(pathname)) return;

		seen.add(pathname);
		addCallback(url);
	}

	async function handleFetch(url: URL, opts: FetchOpts) {
		const href = url.href;
		const timeout_deferred = new Deferred();
		const the_timeout = setTimeout(() => {
			timeout_deferred.reject(new Error(`Timed out waiting for ${href}`));
		}, opts.timeout);

		const r = await Promise.race([
			fetch(href, {
				headers: { host: opts.host_header || opts.host },
				redirect: 'manual'
			}),
			timeout_deferred.promise
		]);

		clearTimeout(the_timeout); // prevent it hanging at the end

		return {
			response: r,
			url
		};
	}

	async function handleResponse(fetched: Promise<FetchRet>, fetchOpts: FetchOpts) {
		const { response, url } = await fetched;
		let pathname = url.pathname;

		if (pathname !== '/service-worker-index.html') {
			pathname = pathname.replace(fetchOpts.root.pathname, '') || '/';
		}

		let type = response.headers.get('Content-Type');

		let body = type.startsWith('text/')
			? await response.text()
			: await response.arrayBuffer();

		const range = ~~(response.status / 100);

		if (range === 2 && type === 'text/html') {
			// parse link rel=preload headers and embed them in the HTML
			const link = parseLinkHeader(response.headers.get('Link') || '');
			link.refs.forEach((ref: Ref) => {
				if (ref.rel === 'preload' || ref.rel === 'modulepreload') {
					body = (body as string).replace('</head>',
						`<link rel=${JSON.stringify(ref.rel)} as=${JSON.stringify(ref.as)} href=${JSON.stringify(ref.uri)} ${ref.as === 'script' ? 'crossorigin="use-credentials"' : ''}></head>`);
				}
			});

			if (pathname !== '/service-worker-index.html') {
				const cleaned = clean_html(body as string);

				const base_match = /<base ([\s\S]+?)>/m.exec(cleaned);
				const base_href = base_match && get_href(base_match[1]);
				const base = resolve(url.href, base_href);

				let match;
				const pattern = /<(a|img|link|source)\s+([\s\S]+?)>/gm;

				while (match = pattern.exec(cleaned)) {
					let hrefs: string[] = [];
					const element = match[1];
					const attrs = match[2];

					if (element === 'a' || element === 'link') {
						hrefs.push(get_href(attrs));
					} else {
						if (element === 'img') {
							hrefs.push(get_src(attrs));
						}
						hrefs.push(...get_srcset_urls(attrs));
					}

					hrefs = hrefs.filter(Boolean);

					for (const href of hrefs) {
						const dest = resolve(base.href, href);
						if (dest.protocol === fetchOpts.protocol && dest.host === fetchOpts.host) {
							handle(dest, fetchOpts, queue.add);
						}
					}
				}
			}
		}

		if (range === 3) {
			const location = response.headers.get('Location');

			type = 'text/html';
			body = `<script>window.location.href = "${location.replace(origin, '')}"</script>`;

			handle(resolve(fetchOpts.root.href, location), fetchOpts, queue.add);
		}

		return save(pathname, response.status, type, body);
	}

	const queueFetchOpts = {
		timeout: timeout === false ? 0 : timeout,
		host,
		host_header,
		protocol,
		root
	};

	const queue = exportQueue({
		concurrent,
		seen,
		saved,
		fetchOpts: queueFetchOpts,
		handleFetch,
		handleResponse,
		callbacks: {
			onDone: () => {}
		}
	});

	proc.on('message', message => {
		if (!message.__sapper__ || message.event !== 'file') return;
		queue.addSave(save(message.url, message.status, message.type, message.body));
	});

	return new Promise((res, rej) => {
		queue.setCallback('onDone', () => {
			proc.kill();
			res();
		});

		ports.wait(port).then(() => {
			try {
				for (const entryPoint of entryPoints) {
					oninfo({
						message: `Crawling ${entryPoint.href}`
					});
					handle(entryPoint, queueFetchOpts, queue.add);
				}

				if (has_serviceworker) {
					const workerUrl = resolve(root.href, 'service-worker-index.html');
					handle(workerUrl, queueFetchOpts, queue.add);
				}
			} catch (err) {
				proc.kill();
				rej(err);
			}
		}).catch(err => {
			proc.kill();
			rej(err);
		});
	});
}
