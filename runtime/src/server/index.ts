import http from 'http';
import middleware from './middleware/index';
import { StartOptions, MiddlewareOptions, Handler } from './types';

export { middleware };

export function start(opts: StartOptions = {}) {
	const handler = middleware(opts) as Handler;
	const server = http.createServer(handler as http.ServerOptions);

	server.listen(opts.port || process.env.PORT);

	return server;
}