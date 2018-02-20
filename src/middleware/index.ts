import * as fs from 'fs';
import * as path from 'path';
import { ClientRequest, ServerResponse } from 'http';
// import * as mime from 'mime';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import serialize from 'serialize-javascript';
import escape_html from 'escape-html';
import { create_routes, templates, create_compilers, create_template } from 'sapper/core.js';
import { dest, entry, isDev, src } from '../config';
import { Route, Template } from '../interfaces';

const dev = isDev();

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
	const client_info = JSON.parse(fs.readFileSync(path.join(dest, 'client_info.json'), 'utf-8'));

	const template = create_template();

	const shell = try_read(path.join(dest, 'index.html'));
	const serviceworker = try_read(path.join(dest, 'service-worker.js'));

	const middleware = compose_handlers([
		(req: Req, res: ServerResponse, next: () => void) => {
			req.pathname = req.url.replace(/\?.*/, '');
			next();
		},

		shell && get_asset_handler({
			pathname: '/index.html',
			type: 'text/html',
			cache: 'max-age=600',
			body: shell
		}),

		serviceworker && get_asset_handler({
			pathname: '/service-worker.js',
			type: 'application/javascript',
			cache: 'max-age=600',
			body: serviceworker
		}),

		(req: Req, res: ServerResponse, next: () => void) => {
			if (req.pathname.startsWith('/client/')) {
				// const type = mime.getType(req.pathname);
				const type = 'application/javascript'; // TODO might not be, if using e.g. CSS plugin

				// TODO cache?
				const rs = fs.createReadStream(path.join(dest, req.pathname.slice(1)));

				rs.on('error', error => {
					res.statusCode = 404;
					res.end('not found');
				});

				res.setHeader('Content-Type', type);
				res.setHeader('Cache-Control', 'max-age=31536000');
				rs.pipe(res);
			} else {
				next();
			}
		},

		get_route_handler(client_info.assetsByChunkName, routes, template)
	].filter(Boolean));

	return middleware;
}

function get_asset_handler({ pathname, type, cache, body }: {
	pathname: string;
	type: string;
	cache: string;
	body: string;
}) {
	return (req: Req, res: ServerResponse, next: () => void) => {
		if (req.pathname !== pathname) return next();

		res.setHeader('Content-Type', type);
		res.setHeader('Cache-Control', cache);
		res.end(body);
	};
}

const resolved = Promise.resolve();

function get_route_handler(chunks: Record<string, string>, routes: RouteObject[], template: Template) {
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

				const page = template.render({
					scripts,
					html,
					head: `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`,
					styles: (css && css.code ? `<style>${css.code}</style>` : '')
				});

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

				handler(req, res, () => {
					handle_not_found(req, res, 404, 'Not found');
				});
			} else {
				// no matching handler for method — 404
				handle_not_found(req, res, 404, 'Not found');
			}
		}
	}

	const not_found_route = routes.find((route: RouteObject) => route.error === '4xx');

	function handle_not_found(req: Req, res: ServerResponse, statusCode: number, message: Error | string) {
		res.statusCode = statusCode;
		res.setHeader('Content-Type', 'text/html');

		const error = message instanceof Error ? message : new Error(message);

		const rendered = not_found_route ? not_found_route.module.render({
			status: 404,
			error
		}) : { head: '', css: null, html: error.message };

		const { head, css, html } = rendered;

		res.end(template.render({
			scripts: `<script src='/client/${chunks.main}'></script>`,
			html,
			head: `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`,
			styles: (css && css.code ? `<style>${css.code}</style>` : '')
		}));
	}

	const error_route = routes.find((route: RouteObject) => route.error === '5xx');

	function handle_error(req: Req, res: ServerResponse, statusCode: number, message: Error | string) {
		if (statusCode >= 400 && statusCode < 500) {
			return handle_not_found(req, res, statusCode, message);
		}

		res.statusCode = statusCode;
		res.setHeader('Content-Type', 'text/html');

		const error = message instanceof Error ? message : new Error(message);

		const rendered = error_route ? error_route.module.render({
			status: 500,
			error
		}) : { head: '', css: null, html: `Internal server error: ${error.message}` };

		const { head, css, html } = rendered;

		res.end(template.render({
			scripts: `<script src='/client/${chunks.main}'></script>`,
			html,
			head: `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`,
			styles: (css && css.code ? `<style>${css.code}</style>` : '')
		}));
	}

	return function find_route(req: Req, res: ServerResponse, next: () => void) {
		const url = req.pathname;

		try {
			for (const route of routes) {
				if (!route.error && route.pattern.test(url)) return handle_route(route, req, res);
			}

			handle_not_found(req, res, 404, 'Not found');
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
		return serialize(data);
	} catch (err) {
		return null;
	}
}

function try_read(file: string) {
	try {
		return fs.readFileSync(file, 'utf-8');
	} catch (err) {
		return null;
	}
}