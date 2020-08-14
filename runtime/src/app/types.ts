import { DOMComponentConstructor, Route } from '@sapper/internal/manifest-client';

export interface HydratedTarget {
	redirect?: Redirect;
	preload_error?: any;
	props: any;
	branch: Array<{ Component: DOMComponentConstructor, preload: (page) => Promise<any>, segment: string }>;
}

export interface ScrollPosition {
	x: number;
	y: number;
}

export interface Target {
	href: string;
	route: Route;
	match: RegExpExecArray;
	page: Page;
}

export interface Redirect {
	statusCode: number;
	location: string;
}

export interface Page {
	host: string;
	path: string;
	params: Record<string, string>;
	query: Record<string, string | string[]>;
}
