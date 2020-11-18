import {
	Preload
} from './shared';

export const src_dir: string;
export const build_dir: string;
export const dev: boolean;
export const manifest: Manifest;

export { SapperRequest, SapperResponse, SapperNext, SapperHandler, SapperErrorHandler } from '@sapper/server';

export interface SSRComponentModule {
	default: SSRComponent;
	preload?: Preload;
}

export interface SSRComponent {
	render(props: unknown): {
		html: string
		head: string
		css: { code: string, map: unknown };
	}
}

export interface Manifest {
	server_routes: ServerRoute[];
	ignore: RegExp[];
	root_comp: SSRComponentModule;
	error: SSRComponent;
	error_handler?: SapperErrorHandler;
	pages: ManifestPage[];
}

export interface ManifestPage {
	pattern: RegExp | null;
	parts: ManifestPagePart[];
}

export interface ManifestPagePart {
	name: string | null;
	file?: string;
	component: SSRComponentModule;
	params?: (match: RegExpMatchArray | null) => Record<string, string>;
}

export interface HttpError extends Error {
	statusCode?: number;
}

export interface ServerRoute {
	pattern: RegExp;
	handlers: Record<string, SapperHandler>;
	params: (match: RegExpMatchArray) => Record<string, string>;
}
