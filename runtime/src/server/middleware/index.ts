import fs from 'fs';
import path from 'path';
import mime from 'mime/lite';
import { SapperRequest, SapperResponse, SapperNext, SapperHandler, SapperErrorHandler, build_dir, dev, manifest } from '@sapper/internal/manifest-server';
import { get_server_route_handler } from './get_server_route_handler';
import { get_page_handler, get_page_renderer } from './get_page_handler';
import { get_error_handler } from './get_error_handler';

type IgnoreValue = IgnoreValue[] | RegExp | ((uri: string) => boolean) | string;

export default function middleware(opts: {
	session?: (req: SapperRequest, res: SapperResponse) => any,
	ignore?: IgnoreValue,
	catchErrors?: boolean
} = {}) {
	const { session, ignore } = opts;

	let emitted_basepath = false;

	const page_renderer = get_page_renderer(manifest, session || noop);
	const page_handler = get_page_handler(manifest, page_renderer);
	const error_handler = get_error_handler(manifest, page_renderer);

	return compose_handlers(ignore, [
		(req: SapperRequest, res: SapperResponse, next: SapperNext) => {
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

		fs.existsSync(path.join(build_dir, 'service-worker.js')) && serve({
			pathname: '/service-worker.js',
			cache_control: 'no-cache, no-store, must-revalidate'
		}),

		fs.existsSync(path.join(build_dir, 'service-worker.js.map')) && serve({
			pathname: '/service-worker.js.map',
			cache_control: 'no-cache, no-store, must-revalidate'
		}),

		serve({
			prefix: '/client/',
			cache_control: dev ? 'no-cache' : 'max-age=31536000, immutable'
		}),

		get_server_route_handler(manifest.server_routes),

		page_handler
	].filter(Boolean), error_handler);
}

export function compose_handlers(ignore: IgnoreValue, handlers: SapperHandler[], error_handler: SapperErrorHandler): SapperHandler {
	const total = handlers.length;

	function nth_handler(n: number, req: SapperRequest, res: SapperResponse, next: SapperNext, error_next: SapperNext) {
		if (n >= total) {
			return next();
		}

		const handler = handlers[n];
		const handler_next: SapperNext = (err) => {
			if (err) {
				error_next(err);
			} else {
				nth_handler(n+1, req, res, next, error_next);
			}
		};

		handler(req, res, handler_next);
	}

	return !ignore
		? (req, res, next) => nth_handler(0, req, res, next, (err) => error_handler(err, req, res, next))
		: (req, res, next) => {
			if (should_ignore(req.path, ignore)) {
				next();
			} else {
				nth_handler(0, req, res, next, (err) => error_handler(err, req, res, next));
			}
		};
}

export function should_ignore(uri: string, val: IgnoreValue) {
	if (Array.isArray(val)) return val.some(x => should_ignore(uri, x));
	if (val instanceof RegExp) return val.test(uri);
	if (typeof val === 'function') return val(uri);
	return uri.startsWith(val.charCodeAt(0) === 47 ? val : `/${val}`);
}

export function serve({ prefix, pathname, cache_control }: {
	prefix?: string,
	pathname?: string,
	cache_control: string
}): SapperHandler {
	const filter = pathname
		? (req: SapperRequest) => req.path === pathname
		: (req: SapperRequest) => req.path.startsWith(prefix);

	const cache: Map<string, Buffer> = new Map();

	const read = dev
		? (file: string) => fs.readFileSync(path.join(build_dir, file))
		: (file: string) => (cache.has(file) ? cache : cache.set(file, fs.readFileSync(path.join(build_dir, file)))).get(file);

	return (req: SapperRequest, res: SapperResponse, next: SapperNext) => {
		if (filter(req)) {
			const type = mime.getType(req.path);

			try {
				const file = path.posix.normalize(decodeURIComponent(req.path));
				const data = read(file);

				res.setHeader('Content-Type', type);
				res.setHeader('Cache-Control', cache_control);
				res.end(data);
			} catch (err) {
				if (err.code === 'ENOENT') {
					next();
				} else {
					next(err);
				}
			}
		} else {
			next();
		}
	};
}

async function noop() {}
