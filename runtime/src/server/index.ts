import http from 'http';
import middleware from './middleware/index';
import { StartOptions, MiddlewareOptions, Handler } from './types';

export { middleware };

export function server(opts: MiddlewareOptions) {
	const handler = middleware(opts) as Handler;
	return http.createServer(handler as http.ServerOptions);
}

export function start(opts: StartOptions = {}) {
	const s = server(opts);
	s.listen(opts.port || process.env.PORT);

	return s;
}