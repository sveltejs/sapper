import { DOMComponentConstructor, Route } from '@sapper/internal/manifest-client';

export interface HydratedTarget {
	redirect?: Redirect;
	preload_error?: any;
	props: any;
	branch: Branch;
}

export type Branch = Array<{
	segment: string;
	match?: RegExpExecArray;
	component?: DOMComponentConstructor;
	part?: number;
}>;

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

/**
 * Information about the current page in the `page` store.
 */
export interface PageContext extends Page {
	/** `error` is only set when the error page is being rendered. */
	error?: Error;
}
