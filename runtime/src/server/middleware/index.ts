import fs from 'fs';
import querystring from 'querystring';
import sirv from 'sirv';
import { build_dir, dev, manifest } from '@sapper/internal/manifest-server';
import { Handler, Req, Res, MiddlewareOptions } from '../types';
import { get_server_route_handler } from './get_server_route_handler';
import { get_page_handler } from './get_page_handler';

export default function middleware(opts: MiddlewareOptions = {}) {
	const { session, ignore } = opts;

	let emitted_basepath = false;

	return compose_handlers(ignore, [
		fs.existsSync('static') && sirv('static', {
			dev,
			setHeaders: opts.static && opts.static.headers && ((res: Response, pathname: string, stats: fs.Stats) => {
				const headers = opts.static.headers(pathname, stats);
				for (const k in headers) res.setHeader(k, headers[k]);
			})
		}),

		sirv(`${build_dir}/client`, {
			dev,
			maxAge: 31536000,
			immutable: true
		}),

		sirv(`${build_dir}/service-worker`, {
			dev,
			maxAge: 300
		}),

		function condition_request(req: Req, res: Res, next: () => void) {
			const qi = req.url.indexOf('?');
			req.query = ~qi ? querystring.parse(req.url.slice(qi + 1)) : {}

			if (req.baseUrl === undefined) {
				let originalUrl = req.originalUrl || req.url;
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

		get_server_route_handler(manifest.server_routes),

		get_page_handler(manifest, session || noop)
	].filter(Boolean));
}

export function compose_handlers(ignore: any, handlers: Handler[]): Handler {
	const total = handlers.length;

	function nth_handler(n: number, req: Req, res: Res, next: () => void) {
		if (n >= total) {
			return next();
		}

		handlers[n](req, res, () => nth_handler(n+1, req, res, next));
	}

	return !ignore
		? (req, res, next) => nth_handler(0, req, res, next)
		: (req, res, next) => {
			if (should_ignore(req.path, ignore)) {
				next();
			} else {
				nth_handler(0, req, res, next);
			}
		};
}

export function should_ignore(uri: string, val: any) {
	if (Array.isArray(val)) return val.some(x => should_ignore(uri, x));
	if (val instanceof RegExp) return val.test(uri);
	if (typeof val === 'function') return val(uri);
	return uri.startsWith(val.charCodeAt(0) === 47 ? val : `/${val}`);
}

function noop(){}
