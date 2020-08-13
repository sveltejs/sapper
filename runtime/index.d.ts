declare module "@sapper/app"
declare module "@sapper/server"
declare module "@sapper/service-worker"

declare module "@sapper/app" {
	interface Redirect {
		statusCode: number
		location: string
	}

	function goto(href: string, opts: { noscroll?: boolean, replaceState?: boolean }): Promise<unknown>
	function prefetch(href: string): Promise<{ redirect?: Redirect; data?: unknown }>
	function prefetchRoutes(pathnames: string[]): Promise<unknown>
	function start(opts: { target: Node }): Promise<unknown>
	const stores: () => unknown;

	export {
		goto, prefetch, prefetchRoutes, start, stores
	};
}

declare module "@sapper/server" {
	import { Handler, Req, Res } from '@sapper/internal/manifest-server';

	interface MiddlewareOptions {
		session?: (req: Req, res: Resp) => unknown
		ignore?: unknown
	}

	function middleware(opts: MiddlewareOptions): Handler

	export { middleware };
}

declare module "@sapper/service-worker" {
	const timestamp: number;
	const files: string[];
	const shell: string[];
	const routes: Array<{ pattern: RegExp }>;

	export {
		timestamp, files, files as assets, shell, routes
	};
}
