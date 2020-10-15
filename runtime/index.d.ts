/*
 * This file declares all Sapper types that are accessible to project code.
 * It is created in src/node_modules/@sapper in projects during the build.
 * It must not import any internal Sapper types as it will not be possible for
 * project code to reference those.
 */

declare module '@sapper/app' {
	export interface Redirect {
		statusCode: number
		location: string
	}

	export function goto(href: string, opts: { noscroll?: boolean, replaceState?: boolean }): Promise<void>;
	export function prefetch(href: string): Promise<{ redirect?: Redirect; data?: unknown }>;
	export function prefetchRoutes(pathnames: string[]): Promise<void>;
	export function start(opts: { target: Node }): Promise<void>;
	export const stores: () => unknown;
}

declare module '@sapper/server' {
	import { ClientRequest, ServerResponse } from 'http';

	export type Ignore = string | RegExp | ((uri: string) => boolean) | Ignore[];

	export interface MiddlewareOptions {
		session?: (req: ClientRequest, res: ServerResponse) => unknown;
		ignore?: Ignore;
	}

	export function middleware(
		opts: MiddlewareOptions
	): (req: ClientRequest, res: ServerResponse, next: () => void) => void;
}

declare module '@sapper/service-worker' {
	export const timestamp: number;
	export const files: string[];
	export const assets: string[];
	export const shell: string[];
	export const routes: Array<{ pattern: RegExp }>;
}

declare module '@sapper/common' {
	export interface PreloadContext {
		fetch: (url: string, options?: any) => Promise<any>;
		error: (statusCode: number, message: Error | string) => void;
		redirect: (statusCode: number, location: string) => void;
	}

	export interface PageContext {
		host: string;
		path: string;
		params: Record<string, string>;
		query: Record<string, string | string[]>;
		/** `error` is only set when the error page is being rendered. */
		error?: Error;
	}

	/**
	 * @deprecated PageContext is the preferred name. Page might be removed in the future.
	 */
	export { PageContext as Page };

	export type PreloadResult = object | Promise<object>

	export interface Preload {
		(this: PreloadContext, page: PageContext, session: any): PreloadResult;
	}
}
