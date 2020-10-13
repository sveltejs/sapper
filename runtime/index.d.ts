declare module '@sapper/app' {
	import { Readable, Writable } from 'svelte/store';
	import { PageContext } from '@sapper/app/types';

	export interface Redirect {
		statusCode: number
		location: string
	}

	export function goto(href: string, opts: { noscroll?: boolean, replaceState?: boolean }): Promise<void>;
	export function prefetch(href: string): Promise<{ redirect?: Redirect; data?: unknown }>;
	export function prefetchRoutes(pathnames: string[]): Promise<void>;
	export function start(opts: { target: Node }): Promise<void>;
	export function stores(): {
		preloading: Readable<boolean>
		page: Readable<PageContext>
		session: Writable<any>
	};
}

declare module '@sapper/server' {
	import { Handler, Req, Res } from '@sapper/internal/manifest-server';

	export type Ignore = string | RegExp | ((uri: string) => boolean) | Ignore[];

	export interface MiddlewareOptions {
		session?: (req: Req, res: Res) => unknown
		ignore?: Ignore
	}

	export function middleware(opts: MiddlewareOptions): Handler;
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

	export { PageContext as Page } from '@sapper/app/types';

	export interface Preload {
		(this: PreloadContext, page: PageContext, session: any): object | Promise<object>;
	}
}
