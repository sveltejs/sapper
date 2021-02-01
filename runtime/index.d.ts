/*
 * This file declares all Sapper types that are accessible to project code.
 * It is created in src/node_modules/@sapper in projects during the build.
 * It must not import any internal Sapper types as it will not be possible for
 * project code to reference those.
 */

declare module '@sapper/app' {
	import { Readable, Writable } from 'svelte/store';
	import { PageContext } from '@sapper/common';

	export interface Redirect {
		statusCode: number
		location: string
	}

	export function goto(href: string, opts?: { noscroll?: boolean, replaceState?: boolean }): Promise<void>;
	export function prefetch(href: string): Promise<{ redirect?: Redirect; data?: unknown }>;
	export function prefetchRoutes(pathnames: string[]): Promise<void>;
	export function start(opts: { target: Node }): Promise<void>;
	export function stores<Session = any>(): {
		preloading: Readable<boolean>
		page: Readable<PageContext>
		session: Writable<Session>
	};
}

declare module '@sapper/server' {
	import { IncomingMessage, ServerResponse } from 'http';
	import { Socket } from 'net';

	export type Ignore = string | RegExp | ((uri: string) => boolean) | Ignore[];

	interface ParsedQs { [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[] }

	/**
	 * The request object passed to middleware and server-side routes. 
	 * These fields are common to both Polka and Express, but you are free to 
	 * instead use the typings that come with the server you use.
	 */
	export interface SapperRequest extends IncomingMessage {
		url: string;
		method: string;	
		baseUrl: string;
	
		/**
		 * The originally requested URL, including parent router segments.
		 */
		originalUrl: string;
	
		/**
		 * The path portion of the requested URL.
		 */
		path: string;
	
		/**
		 * The values of named parameters within your route pattern
		 */
		params: Record<string, string>;
	
		/**
		 * The parsed query string
		 */
		query: ParsedQs;

		socket: Socket;
	}

	export interface SapperResponse extends ServerResponse {
		locals?: {
			nonce?: string;
			name?: string;
		};
	}
		
	export interface MiddlewareOptions {
		session?: (req: SapperRequest, res: SapperResponse) => unknown;
		ignore?: Ignore;
	}

	export function middleware(
		opts?: MiddlewareOptions
	): (req: SapperRequest, res: SapperResponse, next: () => void) => void;
}

declare module '@sapper/service-worker' {
	export const timestamp: number;
	export const files: string[];
	export const assets: string[];
	export const shell: string[];
	export const routes: Array<{ pattern: RegExp }>;
}

declare module '@sapper/common' {

	import type fetchType from 'node-fetch';
	export type FetchResponse = Response | ReturnType<typeof fetchType>;

	export interface PreloadContext {
		fetch: (url: string, options?: any) => Promise<FetchResponse>;
		error: (statusCode: number, message: Error | string) => void;
		redirect: (statusCode: number, location: string) => void;
	}

	export type PageParams = Record<string, string>;
	export type Query = Record<string, string | string[]>;
	
	export interface PageContext {
		host: string;
		path: string;
		params: PageParams;
		query: Query;
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
