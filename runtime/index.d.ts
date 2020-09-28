declare module "@sapper/app";
declare module "@sapper/server";
declare module "@sapper/service-worker";

interface Stores {
	preloading: {
		subscribe(preloading: boolean): () => void;
	};
	page: {
		subscribe(info: {
			error: boolean;
			host: string;
			path: string;
			params: object;
			query: object;
		}): () => void;
	};
	session: {
		set(value: any): void;
		update(update: (existing) => {}): void;
		subscribe(value: any): () => void;
	};
}

declare module "@sapper/app" {
	export interface Redirect {
		statusCode: number;
		location: string;
	}

	export function goto(
		href: string,
		opts: { noscroll?: boolean; replaceState?: boolean }
	): Promise<void>;
	export function prefetch(
		href: string
	): Promise<{ redirect?: Redirect; data?: unknown }>;
	export function prefetchRoutes(pathnames: string[]): Promise<void>;
	export function start(opts: { target: Node }): Promise<void>;
	export function stores(): Stores;
}

declare module "@sapper/server" {
	import { Handler, Req, Res } from "@sapper/internal/manifest-server";

	export type Ignore = string | RegExp | ((uri: string) => boolean) | Ignore[];

	export interface MiddlewareOptions {
		session?: (req: Req, res: Res) => unknown;
		ignore?: Ignore;
	}

	export function middleware(opts: MiddlewareOptions): Handler;
}

declare module "@sapper/service-worker" {
	export const timestamp: number;
	export const files: string[];
	export const assets: string[];
	export const shell: string[];
	export const routes: Array<{ pattern: RegExp }>;
}
