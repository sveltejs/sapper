import * as fs from 'fs';
import * as path from 'path';
import { ClientRequest, ServerResponse } from 'http';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import devalue from 'devalue';
import { lookup } from './middleware/mime';
import { minify_html } from './middleware/minify_html';
import { create_routes, create_compilers } from './core';
import { dest, dev } from './config';
import { Route, Template } from './interfaces';
import sourceMapSupport from 'source-map-support';

sourceMapSupport.install();

type RouteObject = {
	id: string;
	type: 'page' | 'route';
	pattern: RegExp;
	params: (match: RegExpMatchArray) => Record<string, string>;
	module: {
		render: (data: any) => {
			head: string;
			css: { code: string, map: any };
			html: string
		},
		preload: (data: any) => any | Promise<any>
	};
	error?: string;
}

type Handler = (req: Req, res: ServerResponse, next: () => void) => void;

interface Req extends ClientRequest {
	url: string;
	method: string;
	pathname: string;
	params: Record<string, string>;
}

export default function middleware({ routes }: {
	routes: RouteObject[]
}) {
	const output = dest();

	const client_info = JSON.parse(fs.readFileSync(path.join(output, 'client_info.json'), 'utf-8'));

	const middleware = compose_handlers([
		(req: Req, res: ServerResponse, next: () => void) => {
			req.pathname = req.url.replace(/\?.*/, '');
			next();
		},

		fs.existsSync(path.join(output, 'index.html')) && serve({
			pathname: '/index.html',
			cache_control: 'max-age=600'
		}),

		fs.existsSync(path.join(output, 'service-worker.js')) && serve({
			pathname: '/service-worker.js',
			cache_control: 'max-age=600'
		}),

		serve({
			prefix: '/client/',
			cache_control: 'max-age=31536000'
		}),

		get_route_handler(client_info.assetsByChunkName, routes)
	].filter(Boolean));

	return middleware;
}

function serve({ prefix, pathname, cache_control }: {
	prefix?: string,
	pathname?: string,
	cache_control: string
}) {
	const filter = pathname
		? (req: Req) => req.pathname === pathname
		: (req: Req) => req.pathname.startsWith(prefix);

	const output = dest();

	const cache: Map<string, Buffer> = new Map();

	const read = dev()
		? (file: string) => fs.readFileSync(path.resolve(output, file))
		: (file: string) => (cache.has(file) ? cache : cache.set(file, fs.readFileSync(path.resolve(output, file)))).get(file)

	return (req: Req, res: ServerResponse, next: () => void) => {
		if (filter(req)) {
			const type = lookup(req.pathname);

			try {
				const data = read(req.pathname.slice(1));

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

const resolved = Promise.resolve();

function get_route_handler(chunks: Record<string, string>, routes: RouteObject[]) {
	const template = dev()
		? () => fs.readFileSync('app/template.html', 'utf-8')
		: (str => () => str)(minify_html(fs.readFileSync('app/template.html', 'utf-8')));

	function handle_route(route: RouteObject, req: Req, res: ServerResponse) {
		req.params = route.params(route.pattern.exec(req.pathname));

		const mod = route.module;

		if (route.type === 'page') {
			res.setHeader('Content-Type', 'text/html');

			// preload main.js and current route
			// TODO detect other stuff we can preload? images, CSS, fonts?
			const link = []
				.concat(chunks.main, chunks[route.id])
				.map(file => `</client/${file}>;rel="preload";as="script"`)
				.join(', ');

			res.setHeader('Link', link);

			const data = { params: req.params, query: req.query };

			let redirect: { statusCode: number, location: string };
			let error: { statusCode: number, message: Error | string };

			Promise.resolve(
				mod.preload ? mod.preload.call({
					redirect: (statusCode: number, location: string) => {
						redirect = { statusCode, location };
					},
					error: (statusCode: number, message: Error | string) => {
						error = { statusCode, message };
					}
				}, req) : {}
			).catch(err => {
				error = { statusCode: 500, message: err };
			}).then(preloaded => {
				if (redirect) {
					res.statusCode = redirect.statusCode;
					res.setHeader('Location', redirect.location);
					res.end();

					return;
				}

				if (error) {
					handle_error(req, res, error.statusCode, error.message);
					return;
				}

				const serialized = try_serialize(preloaded); // TODO bail on non-POJOs
				Object.assign(data, preloaded);

				const { html, head, css } = mod.render(data);

				let scripts = []
					.concat(chunks.main) // chunks main might be an array. it might not! thanks, webpack
					.map(file => `<script src='/client/${file}'></script>`)
					.join('');

				scripts = `<script>__SAPPER__ = { preloaded: ${serialized} };</script>${scripts}`;

				const page = template()
					.replace('%sapper.scripts%', scripts)
					.replace('%sapper.html%', html)
					.replace('%sapper.head%', `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`)
					.replace('%sapper.styles%', (css && css.code ? `<style>${css.code}</style>` : ''));

				res.end(page);

				if (process.send) {
					process.send({
						__sapper__: true,
						url: req.url,
						method: req.method,
						status: 200,
						type: 'text/html',
						body: page
					});
				}
			});
		}

		else {
			const method = req.method.toLowerCase();
			// 'delete' cannot be exported from a module because it is a keyword,
			// so check for 'del' instead
			const method_export = method === 'delete' ? 'del' : method;
			const handler = mod[method_export];
			if (handler) {
				if (process.env.SAPPER_EXPORT) {
					const { write, end, setHeader } = res;
					const chunks: any[] = [];
					const headers: Record<string, string> = {};

					// intercept data so that it can be exported
					res.write = function(chunk: any) {
						chunks.push(new Buffer(chunk));
						write.apply(res, arguments);
					};

					res.setHeader = function(name: string, value: string) {
						headers[name.toLowerCase()] = value;
						setHeader.apply(res, arguments);
					};

					res.end = function(chunk?: any) {
						if (chunk) chunks.push(new Buffer(chunk));
						end.apply(res, arguments);

						process.send({
							__sapper__: true,
							url: req.url,
							method: req.method,
							status: res.statusCode,
							type: headers['content-type'],
							body: Buffer.concat(chunks).toString()
						});
					};
				}

				const handle_bad_result = (err?: Error) => {
					if (err) {
						console.error(err.stack);
						res.statusCode = 500;
						res.end(err.message);
					} else {
						handle_error(req, res, 404, 'Not found');
					}
				};

				try {
					handler(req, res, handle_bad_result);
				} catch (err) {
					handle_bad_result(err);
				}
			} else {
				// no matching handler for method — 404
				handle_error(req, res, 404, 'Not found');
			}
		}
	}

	const not_found_route = routes.find((route: RouteObject) => route.error === '4xx');
	const error_route = routes.find((route: RouteObject) => route.error === '5xx');

	function handle_error(req: Req, res: ServerResponse, statusCode: number, message: Error | string) {
		res.statusCode = statusCode;
		res.setHeader('Content-Type', 'text/html');

		const error = message instanceof Error ? message : new Error(message);

		const not_found = statusCode >= 400 && statusCode < 500;

		const route = not_found
			? not_found_route
			: error_route;

		const title: string = not_found
			? 'Not found'
			: `Internal server error: ${error.message}`;

		const rendered = route ? route.module.render({
			status: statusCode,
			error
		}) : { head: '', css: null, html: title };

		const { head, css, html } = rendered;

		const page = template()
			.replace('%sapper.scripts%', `<script src='/client/${chunks.main}'></script>`)
			.replace('%sapper.html%', html)
			.replace('%sapper.head%', `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`)
			.replace('%sapper.styles%', (css && css.code ? `<style>${css.code}</style>` : ''));

		res.end(page);
	}

	return function find_route(req: Req, res: ServerResponse) {
		const url = req.pathname;

		try {
			for (const route of routes) {
				if (!route.error && route.pattern.test(url)) return handle_route(route, req, res);
			}

			handle_error(req, res, 404, 'Not found');
		} catch (error) {
			handle_error(req, res, 500, error);
		}
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

function read_json(file: string) {
	return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function try_serialize(data: any) {
	try {
		return devalue(data);
	} catch (err) {
		return null;
	}
}