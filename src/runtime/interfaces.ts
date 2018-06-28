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
	destroy: () => void;
}

export type Route = {
	pattern: RegExp;
	load: () => Promise<{ default: ComponentConstructor }>;
	error?: boolean;
	params?: (match: RegExpExecArray) => Record<string, string>;
	ignore?: boolean;
};

export type ScrollPosition = {
	x: number;
	y: number;
};

export type Target = {
	url: URL;
	route: Route;
	props: RouteData;
};