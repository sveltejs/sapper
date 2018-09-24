import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { ClientRequest, ServerResponse } from 'http';
import cookie from 'cookie';
import devalue from 'devalue';
import fetch from 'node-fetch';
import { lookup } from './middleware/mime';
import { locations, dev } from './config';
import sourceMapSupport from 'source-map-support';
import read_template from './core/read_template';

sourceMapSupport.install();

type ServerRoute = {
	pattern: RegExp;
	handlers: Record<string, Handler>;
	params: (match: RegExpMatchArray) => Record<string, string>;
};

type Page = {
	pattern: RegExp;
	parts: Array<{
		name: string;
		component: Component;
		params?: (match: RegExpMatchArray) => Record<string, string>;
	}>
};

type Manifest = {
	server_routes: ServerRoute[];
	pages: Page[];
	root: Component;
	error: Component;
}

type Handler = (req: Req, res: ServerResponse, next: () => void) => void;

type Store = {
	get: () => any
};

type Props = {
	path: string;
	query: Record<string, string>;
	params: Record<string, string>;
	error?: { message: string };
	status?: number;
	child: {
		segment: string;
		component: Component;
		props: Props;
	};
	[key: string]: any;
};

interface Req extends ClientRequest {
	url: string;
	baseUrl: string;
	originalUrl: string;
	method: string;
	path: string;
	params: Record<string, string>;
	query: Record<string, string>;
	headers: Record<string, string>;
}

interface Component {
	render: (data: any, opts: { store: Store }) => {
		head: string;
		css: { code: string, map: any };
		html: string
	},
	preload: (data: any) => any | Promise<any>
}

const IGNORE = '__SAPPER__IGNORE__';
function toIgnore(uri: string, val: any) {
	if (Array.isArray(val)) return val.some(x => toIgnore(uri, x));
	if (val instanceof RegExp) return val.test(uri);
	if (typeof val === 'function') return val(uri);
	return uri.startsWith(val.charCodeAt(0) === 47 ? val : `/${val}`);
}

export default function middleware(opts: {
	manifest: Manifest,
	store: (req: Req, res: ServerResponse) => Store,
	ignore?: any,
	routes?: any // legacy
}) {
	if (opts.routes) {
		throw new Error(`As of Sapper 0.15, opts.routes should be opts.manifest`);
	}

	const output = locations.dest();

	const { manifest, store, ignore } = opts;

	let emitted_basepath = false;

	const middleware = compose_handlers([
		ignore && ((req: Req, res: ServerResponse, next: () => void) => {
			req[IGNORE] = toIgnore(req.path, ignore);
			next();
		}),

		(req: Req, res: ServerResponse, next: () => void) => {
			if (req[IGNORE]) return next();

			if (req.baseUrl === undefined) {
				let { originalUrl } = req;
				if (req.url === '/' && originalUrl[originalUrl.length - 1] !== '/') {
					originalUrl += '/';
				}

				req.baseUrl = originalUrl
					? originalUrl.slice(0, -req.url.length)
					: '';
			}

			if (!emitted_basepath && process.send) {
				process.send({
					__sapper__: true,
					event: 'basepath',
					basepath: req.baseUrl
				});

				emitted_basepath = true;
			}

			if (req.path === undefined) {
				req.path = req.url.replace(/\?.*/, '');
			}

			next();
		},

		fs.existsSync(path.join(output, 'index.html')) && serve({
			pathname: '/index.html',
			cache_control: dev() ? 'no-cache' : 'max-age=600'
		}),

		fs.existsSync(path.join(output, 'service-worker.js')) && serve({
			pathname: '/service-worker.js',
			cache_control: 'no-cache, no-store, must-revalidate'
		}),

		fs.existsSync(path.join(output, 'service-worker.js.map')) && serve({
			pathname: '/service-worker.js.map',
			cache_control: 'no-cache, no-store, must-revalidate'
		}),

		serve({
			prefix: '/client/',
			cache_control: dev() ? 'no-cache' : 'max-age=31536000, immutable'
		}),

		get_server_route_handler(manifest.server_routes),
		get_page_handler(manifest, store)
	].filter(Boolean));

	return middleware;
}

function serve({ prefix, pathname, cache_control }: {
	prefix?: string,
	pathname?: string,
	cache_control: string
}) {
	const filter = pathname
		? (req: Req) => req.path === pathname
		: (req: Req) => req.path.startsWith(prefix);

	const output = locations.dest();

	const cache: Map<string, Buffer> = new Map();

	const read = dev()
		? (file: string) => fs.readFileSync(path.resolve(output, file))
		: (file: string) => (cache.has(file) ? cache : cache.set(file, fs.readFileSync(path.resolve(output, file)))).get(file)

	return (req: Req, res: ServerResponse, next: () => void) => {
		if (req[IGNORE]) return next();

		if (filter(req)) {
			const type = lookup(req.path);

			try {
				const file = decodeURIComponent(req.path.slice(1));
				const data = read(file);

				res.setHeader('Content-Type', type);
				res.setHeader('Cache-Control', cache_control);
				res.end(data);
			} catch (err) {
				res.statusCode = 404;
				res.end('not found');
			}
		} else {
			next();
		}
	};
}

function get_server_route_handler(routes: ServerRoute[]) {
	function handle_route(route: ServerRoute, req: Req, res: ServerResponse, next: () => void) {
		req.params = route.params(route.pattern.exec(req.path));

		const method = req.method.toLowerCase();
		// 'delete' cannot be exported from a module because it is a keyword,
		// so check for 'del' instead
		const method_export = method === 'delete' ? 'del' : method;
		const handle_method = route.handlers[method_export];
		if (handle_method) {
			if (process.env.SAPPER_EXPORT) {
				const { write, end, setHeader } = res;
				const chunks: any[] = [];
				const headers: Record<string, string> = {};

				// intercept data so that it can be exported
				res.write = function(chunk: any) {
					chunks.push(Buffer.from(chunk));
					write.apply(res, arguments);
				};

				res.setHeader = function(name: string, value: string) {
					headers[name.toLowerCase()] = value;
					setHeader.apply(res, arguments);
				};

				res.end = function(chunk?: any) {
					if (chunk) chunks.push(Buffer.from(chunk));
					end.apply(res, arguments);

					process.send({
						__sapper__: true,
						event: 'file',
						url: req.url,
						method: req.method,
						status: res.statusCode,
						type: headers['content-type'],
						body: Buffer.concat(chunks).toString()
					});
				};
			}

			const handle_next = (err?: Error) => {
				if (err) {
					res.statusCode = 500;
					res.end(err.message);
				} else {
					process.nextTick(next);
				}
			};

			try {
				handle_method(req, res, handle_next);
			} catch (err) {
				handle_next(err);
			}
		} else {
			// no matching handler for method
			process.nextTick(next);
		}
	}

	return function find_route(req: Req, res: ServerResponse, next: () => void) {
		if (req[IGNORE]) return next();

		for (const route of routes) {
			if (route.pattern.test(req.path)) {
				handle_route(route, req, res, next);
				return;
			}
		}

		next();
	};
}

function get_page_handler(
	manifest: Manifest,
	store_getter: (req: Req, res: ServerResponse) => Store
) {
	const output = locations.dest();

	const get_build_info = dev()
		? () => JSON.parse(fs.readFileSync(path.join(output, 'build.json'), 'utf-8'))
		: (assets => () => assets)(JSON.parse(fs.readFileSync(path.join(output, 'build.json'), 'utf-8')));

	const template = dev()
		? () => read_template()
		: (str => () => str)(read_template(output));

	const { server_routes, pages } = manifest;
	const error_route = manifest.error;

	function handle_error(req: Req, res: ServerResponse, statusCode: number, error: Error | string) {
		handle_page({
			pattern: null,
			parts: [
				{ name: null, component: error_route }
			]
		}, req, res, statusCode, error || new Error('Unknown error in preload function'));
	}

	function handle_page(page: Page, req: Req, res: ServerResponse, status = 200, error: Error | string = null) {
		const build_info: {
			bundler: 'rollup' | 'webpack',
			shimport: string | null,
			assets: Record<string, string | string[]>,
			legacy_assets?: Record<string, string>
		 } = get_build_info();

		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Cache-Control', dev() ? 'no-cache' : 'max-age=600');

		// preload main.js and current route
		// TODO detect other stuff we can preload? images, CSS, fonts?
		let preloaded_chunks = Array.isArray(build_info.assets.main) ? build_info.assets.main : [build_info.assets.main];
		if (!error) {
			page.parts.forEach(part => {
				if (!part) return;

				// using concat because it could be a string or an array. thanks webpack!
				preloaded_chunks = preloaded_chunks.concat(build_info.assets[part.name]);
			});
		}

		const link = preloaded_chunks
			.filter(file => file && !file.match(/\.map$/))
			.map(file => `<${req.baseUrl}/client/${file}>;rel="preload";as="script"`)
			.join(', ');

		res.setHeader('Link', link);

		const store = store_getter ? store_getter(req, res) : null;

		let redirect: { statusCode: number, location: string };
		let preload_error: { statusCode: number, message: Error | string };

		const preload_context = {
			redirect: (statusCode: number, location: string) => {
				if (redirect && (redirect.statusCode !== statusCode || redirect.location !== location)) {
					throw new Error(`Conflicting redirects`);
				}
				location = location.replace(/^\//g, ''); // leading slash (only)
				redirect = { statusCode, location };
			},
			error: (statusCode: number, message: Error | string) => {
				preload_error = { statusCode, message };
			},
			fetch: (url: string, opts?: any) => {
				const parsed = new URL(url, `http://127.0.0.1:${process.env.PORT}${req.baseUrl ? req.baseUrl + '/' :''}`);

				if (opts) {
					opts = Object.assign({}, opts);

					const include_cookies = (
						opts.credentials === 'include' ||
						opts.credentials === 'same-origin' && parsed.origin === `http://127.0.0.1:${process.env.PORT}`
					);

					if (include_cookies) {
						if (!opts.headers) opts.headers = {};

						const str = []
							.concat(
								cookie.parse(req.headers.cookie || ''),
								cookie.parse(opts.headers.cookie || ''),
								cookie.parse(res.getHeader('Set-Cookie') || '')
							)
							.map(cookie => {
								return Object.keys(cookie)
									.map(name => `${name}=${encodeURIComponent(cookie[name])}`)
									.join('; ');
							})
							.filter(Boolean)
							.join(', ');

						opts.headers.cookie = str;
					}
				}

				return fetch(parsed.href, opts);
			},
			store
		};

		const root_preloaded = manifest.root.preload
			? manifest.root.preload.call(preload_context, {
				path: req.path,
				query: req.query,
				params: {}
			})
			: {};

		const match = error ? null : page.pattern.exec(req.path);

		Promise.all([root_preloaded].concat(page.parts.map(part => {
			if (!part) return null;

			return part.component.preload
				? part.component.preload.call(preload_context, {
					path: req.path,
					query: req.query,
					params: part.params ? part.params(match) : {}
				})
				: {};
		}))).catch(err => {
			preload_error = { statusCode: 500, message: err };
			return []; // appease TypeScript
		}).then(preloaded => {
			if (redirect) {
				const location = `${req.baseUrl}/${redirect.location}`;

				res.statusCode = redirect.statusCode;
				res.setHeader('Location', location);
				res.end();

				return;
			}

			if (preload_error) {
				handle_error(req, res, preload_error.statusCode, preload_error.message);
				return;
			}

			const serialized = {
				preloaded: `[${preloaded.map(data => try_serialize(data)).join(',')}]`,
				store: store && try_serialize(store.get())
			};

			const segments = req.path.split('/').filter(Boolean);

			const props: Props = {
				path: req.path,
				query: req.query,
				params: {},
				child: null
			};

			if (error) {
				props.error = error instanceof Error ? error : { message: error };
				props.status = status;
			}

			const data = Object.assign({}, props, preloaded[0], {
				params: {},
				child: {
					segment: segments[0]
				}
			});

			let level = data.child;
			for (let i = 0; i < page.parts.length; i += 1) {
				const part = page.parts[i];
				if (!part) continue;

				const get_params = part.params || (() => ({}));

				Object.assign(level, {
					component: part.component,
					props: Object.assign({}, props, {
						params: get_params(match)
					}, preloaded[i + 1])
				});

				level.props.child = <Props["child"]>{
					segment: segments[i + 1]
				};
				level = level.props.child;
			}

			const { html, head, css } = manifest.root.render(data, {
				store
			});

			let script = `__SAPPER__={${[
				error && `error:1`,
				`baseUrl:"${req.baseUrl}"`,
				serialized.preloaded && `preloaded:${serialized.preloaded}`,
				serialized.store && `store:${serialized.store}`
			].filter(Boolean).join(',')}};`;

			const has_service_worker = fs.existsSync(path.join(locations.dest(), 'service-worker.js'));
			if (has_service_worker) {
				script += `if('serviceWorker' in navigator)navigator.serviceWorker.register('${req.baseUrl}/service-worker.js');`;
			}

			const file = [].concat(build_info.assets.main).filter(file => file && /\.js$/.test(file))[0];
			const main = `${req.baseUrl}/client/${file}`;

			if (build_info.bundler === 'rollup') {
				if (build_info.legacy_assets) {
					const legacy_main = `${req.baseUrl}/client/legacy/${build_info.legacy_assets.main}`;
					script += `(function(){try{eval("async function x(){}");var main="${main}"}catch(e){main="${legacy_main}"};try{new Function("import('"+main+"')")();}catch(e){var s=document.createElement("script");s.src="${req.baseUrl}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main",main);document.head.appendChild(s);}}());`;
				} else {
					script += `try{new Function("import('${main}')")();}catch(e){var s=document.createElement("script");s.src="${req.baseUrl}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main","${main}");document.head.appendChild(s);}`;
				}
			} else {
				script += `</script><script src="${main}">`;
			}

			let styles: string;

			// TODO make this consistent across apps
			if (build_info.css && build_info.css.main) {
				const css_chunks = new Set();
				if (build_info.css.main) css_chunks.add(build_info.css.main);
				page.parts.forEach(part => {
					if (!part) return;
					const css_chunks_for_part = build_info.css.chunks[part.file];

					if (css_chunks_for_part) {
						css_chunks_for_part.forEach(file => {
							css_chunks.add(file);
						});
					}
				});

				styles = Array.from(css_chunks)
					.map(href => `<link rel="stylesheet" href="client/${href}">`)
					.join('')
			} else {
				styles = (css && css.code ? `<style>${css.code}</style>` : '');
			}

			// users can set a CSP nonce using res.locals.nonce
			const nonce_attr = (res.locals && res.locals.nonce) ? ` nonce="${res.locals.nonce}"` : '';

			const body = template()
				.replace('%sapper.base%', () => `<base href="${req.baseUrl}/">`)
				.replace('%sapper.scripts%', () => `<script${nonce_attr}>${script}</script>`)
				.replace('%sapper.html%', () => html)
				.replace('%sapper.head%', () => `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`)
				.replace('%sapper.styles%', () => styles);

			res.statusCode = status;
			res.end(body);
		}).catch(err => {
			if (error) {
				// we encountered an error while rendering the error page — oops
				res.statusCode = 500;
				res.end(`<pre>${escape_html(err.message)}</pre>`);
			} else {
				handle_error(req, res, 500, err);
			}
		});
	}

	return function find_route(req: Req, res: ServerResponse, next: () => void) {
		if (req[IGNORE]) return next();

		if (!server_routes.some(route => route.pattern.test(req.path))) {
			for (const page of pages) {
				if (page.pattern.test(req.path)) {
					handle_page(page, req, res);
					return;
				}
			}
		}

		handle_error(req, res, 404, 'Not found');
	};
}

function compose_handlers(handlers: Handler[]) {
	return (req: Req, res: ServerResponse, next: () => void) => {
		let i = 0;
		function go() {
			const handler = handlers[i];

			if (handler) {
				handler(req, res, () => {
					i += 1;
					go();
				});
			} else {
				next();
			}
		}

		go();
	};
}

function try_serialize(data: any) {
	try {
		return devalue(data);
	} catch (err) {
		return null;
	}
}

function escape_html(html: string) {
	const chars: Record<string, string> = {
		'"' : 'quot',
		"'": '#39',
		'&': 'amp',
		'<' : 'lt',
		'>' : 'gt'
	};

	return html.replace(/["'&<>]/g, c => `&${chars[c]};`);
}
