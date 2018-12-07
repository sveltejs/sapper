import * as fs from 'fs';
import * as path from 'path';
import cookie from 'cookie';
import devalue from 'devalue';
import fetch from 'node-fetch';
import { URL, resolve } from 'url';
import { build_dir, dev, src_dir, IGNORE } from '../placeholders';
import { Manifest, Page, Props, Req, Res, Store } from './types';

export function get_page_handler(
	manifest: Manifest,
	store_getter: (req: Req, res: Res) => Store
) {
	const get_build_info = dev
		? () => JSON.parse(fs.readFileSync(path.join(build_dir, 'build.json'), 'utf-8'))
		: (assets => () => assets)(JSON.parse(fs.readFileSync(path.join(build_dir, 'build.json'), 'utf-8')));

	const template = dev
		? () => read_template(src_dir)
		: (str => () => str)(read_template(build_dir));

	const has_service_worker = fs.existsSync(path.join(build_dir, 'service-worker.js'));

	const { server_routes, pages } = manifest;
	const error_route = manifest.error;

	function handle_error(req: Req, res: Res, statusCode: number, error: Error | string) {
		handle_page({
			pattern: null,
			parts: [
				{ name: null, component: error_route }
			]
		}, req, res, statusCode, error || new Error('Unknown error in preload function'));
	}

	async function handle_page(page: Page, req: Req, res: Res, status = 200, error: Error | string = null) {
		const build_info: {
			bundler: 'rollup' | 'webpack',
			shimport: string | null,
			assets: Record<string, string | string[]>,
			legacy_assets?: Record<string, string>
		 } = get_build_info();

		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Cache-Control', dev ? 'no-cache' : 'max-age=600');

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

		if (build_info.bundler === 'rollup') {
			// TODO add dependencies and CSS
			const link = preloaded_chunks
				.filter(file => file && !file.match(/\.map$/))
				.map(file => `<${req.baseUrl}/client/${file}>;rel="modulepreload"`)
				.join(', ');

			res.setHeader('Link', link);
		} else {
			const link = preloaded_chunks
				.filter(file => file && !file.match(/\.map$/))
				.map((file) => {
					const as = /\.css$/.test(file) ? 'style' : 'script';
					return `<${req.baseUrl}/client/${file}>;rel="preload";as="${as}"`;
				})
				.join(', ');

			res.setHeader('Link', link);
		}

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

						const cookies = Object.assign(
							{},
							cookie.parse(req.headers.cookie || ''),
							cookie.parse(opts.headers.cookie || '')
						);

						const set_cookie = res.getHeader('Set-Cookie');
						(Array.isArray(set_cookie) ? set_cookie : [set_cookie]).forEach(str => {
							const match = /([^=]+)=([^;]+)/.exec(<string>str);
							if (match) cookies[match[1]] = match[2];
						});

						const str = Object.keys(cookies)
							.map(key => `${key}=${cookies[key]}`)
							.join('; ');

						opts.headers.cookie = str;
					}
				}

				return fetch(parsed.href, opts);
			},
			store
		};

		let preloaded;
		let match;

		try {
			const root_preloaded = manifest.root.preload
				? manifest.root.preload.call(preload_context, {
					path: req.path,
					query: req.query,
					params: {}
				})
				: {};

			match = error ? null : page.pattern.exec(req.path);

			preloaded = await Promise.all([root_preloaded].concat(page.parts.map(part => {
				if (!part) return null;

				return part.component.preload
					? part.component.preload.call(preload_context, {
						path: req.path,
						query: req.query,
						params: part.params ? part.params(match) : {}
					})
					: {};
			})));
		} catch (err) {
			preload_error = { statusCode: 500, message: err };
			preloaded = []; // appease TypeScript
		}

		try {
			if (redirect) {
				const location = resolve(req.baseUrl || '/', redirect.location);

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

			if (has_service_worker) {
				script += `if('serviceWorker' in navigator)navigator.serviceWorker.register('${req.baseUrl}/service-worker.js');`;
			}

			const file = [].concat(build_info.assets.main).filter(file => file && /\.js$/.test(file))[0];
			const main = `${req.baseUrl}/client/${file}`;

			if (build_info.bundler === 'rollup') {
				if (build_info.legacy_assets) {
					const legacy_main = `${req.baseUrl}/client/legacy/${build_info.legacy_assets.main}`;
					script += `(function(){try{eval("async function x(){}");var main="${main}"}catch(e){main="${legacy_main}"};var s=document.createElement("script");try{new Function("if(0)import('')")();s.src=main;s.type="module";s.crossOrigin="use-credentials";}catch(e){s.src="${req.baseUrl}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main",main);}document.head.appendChild(s);}());`;
				} else {
					script += `var s=document.createElement("script");try{new Function("if(0)import('')")();s.src="${main}";s.type="module";s.crossOrigin="use-credentials";}catch(e){s.src="${req.baseUrl}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main","${main}")}document.head.appendChild(s)`;
				}
			} else {
				script += `</script><script src="${main}">`;
			}

			let styles: string;

			// TODO make this consistent across apps
			// TODO embed build_info in placeholder.ts
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
		} catch(err) {
			if (error) {
				// we encountered an error while rendering the error page — oops
				res.statusCode = 500;
				res.end(`<pre>${escape_html(err.message)}</pre>`);
			} else {
				handle_error(req, res, 500, err);
			}
		}
	}

	return function find_route(req: Req, res: Res, next: () => void) {
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

function read_template(dir = build_dir) {
	return fs.readFileSync(`${dir}/template.html`, 'utf-8');
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
