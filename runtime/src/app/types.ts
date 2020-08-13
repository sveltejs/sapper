import { Route } from '@sapper/internal/manifest-client';
import { ComponentConstructor } from '@sapper/internal/shared';

export interface HydratedTarget {
	redirect?: Redirect;
	preload_error?: any;
	props: any;
	branch: Array<{ Component: ComponentConstructor, preload: (page) => Promise<any>, segment: string }>;
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
