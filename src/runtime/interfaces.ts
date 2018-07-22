import { Store } from '../interfaces';

export { Store };
export type Params = Record<string, string>;
export type Query = Record<string, string | true>;
export type RouteData = { params: Params, query: Query, path: string };

export interface ComponentConstructor {
	new (options: { target: Node, data: any, store: Store, hydrate: boolean }): Component;
	preload: (props: { params: Params, query: Query }) => Promise<any>;
};

export interface Component {
	set: (data: any) => void;
	destroy: () => void;
}

export type Page = {
	pattern: RegExp;
	parts: Array<{
		component: () => Promise<{ default: ComponentConstructor }>;
		params?: (match: RegExpExecArray) => Record<string, string>;
	}>;
};

export type Manifest = {
	ignore: RegExp[];
	root: ComponentConstructor;
	error: () => Promise<{ default: ComponentConstructor }>;
	pages: Page[]
};

export type ScrollPosition = {
	x: number;
	y: number;
};

export type Target = {
	url: URL;
	path: string;
	page: Page;
	match: RegExpExecArray;
	query: Record<string, string | true>;
};

export type Redirect = {
	statusCode: number;
	location: string;
};