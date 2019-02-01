import * as fs from 'fs';
import * as path from 'path';
import { build_dir, dev, manifest, IGNORE } from '../placeholders';
import { Handler, Req, Res, Store } from './types';
import { get_server_route_handler } from './get_server_route_handler';
import { get_page_handler } from './get_page_handler';
import { lookup } from './mime';

export default function middleware(opts: {
	store?: (req: Req, res: Res) => Store,
	ignore?: any
} = {}) {
	const { store, ignore } = opts;

	let emitted_basepath = false;

	return compose_handlers([
		ignore && ((req: Req, res: Res, next: () => void) => {
			req[IGNORE] = should_ignore(req.path, ignore);
			next();
		}),

		(req: Req, res: Res, next: () => void) => {
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

		fs.existsSync(path.join(build_dir, 'index.html')) && serve({
			pathname: '/index.html',
			cache_control: dev ? 'no-cache' : 'max-age=600'
		}),

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

		get_page_handler(manifest, store)
	].filter(Boolean));
}

export function compose_handlers(handlers: Handler[]) {
	return (req: Req, res: Res, next: () => void) => {
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

export function should_ignore(uri: string, val: any) {
	if (Array.isArray(val)) return val.some(x => should_ignore(uri, x));
	if (val instanceof RegExp) return val.test(uri);
	if (typeof val === 'function') return val(uri);
	return uri.startsWith(val.charCodeAt(0) === 47 ? val : `/${val}`);
}

export function serve({ prefix, pathname, cache_control }: {
	prefix?: string,
	pathname?: string,
	cache_control: string
}) {
	const filter = pathname
		? (req: Req) => req.path === pathname
		: (req: Req) => req.path.startsWith(prefix);

	const cache: Map<string, Buffer> = new Map();

	const read = dev
		? (file: string) => fs.readFileSync(path.resolve(build_dir, file))
		: (file: string) => (cache.has(file) ? cache : cache.set(file, fs.readFileSync(path.resolve(build_dir, file)))).get(file)

	return (req: Req, res: Res, next: () => void) => {
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