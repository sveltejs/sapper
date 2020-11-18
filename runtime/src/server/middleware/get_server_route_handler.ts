import { SapperRequest, SapperResponse, SapperNext, ServerRoute } from '@sapper/internal/manifest-server';

export function get_server_route_handler(routes: ServerRoute[]) {
	async function handle_route(route: ServerRoute, req: SapperRequest, res: SapperResponse, next: SapperNext) {
		const handle_next = (err?: Error) => {
			process.nextTick(() => next(err));
		};

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
					return write.apply(res, [chunk]);
				};

				res.setHeader = function(name: string, value: string) {
					headers[name.toLowerCase()] = value;
					setHeader.apply(res, [name, value]);
				};

				res.end = function(chunk?: any) {
					if (chunk) chunks.push(Buffer.from(chunk));
					end.apply(res, [chunk]);

					process.send({
						__sapper__: true,
						event: 'file',
						url: req.url,
						method: req.method,
						status: res.statusCode,
						type: headers['content-type'],
						body: Buffer.concat(chunks)
					});
				};
			}

			try {
				await handle_method(req, res, handle_next);
			} catch (err) {
				handle_next(err);
			}
		} else {
			// no matching handler for method
			handle_next();
		}
	}

	return function find_route(req: SapperRequest, res: SapperResponse, next: SapperNext) {
		for (const route of routes) {
			if (route.pattern.test(req.path)) {
				handle_route(route, req, res, next);
				return;
			}
		}

		next();
	};
}
