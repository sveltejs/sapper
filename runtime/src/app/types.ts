export type Params = Record<string, string>;
export type Query = Record<string, string | string[]>;
export type RouteData = { params: Params, query: Query, path: string };

type Child = {
	segment?: string;
	props?: any;
	component?: Component;
};

export interface Component {
	$set: (data: any) => void;
	$destroy: () => void;
}

export type Route = {
	pattern: RegExp;
	parts: Array<{
		i: number;
		params?: (match: RegExpExecArray) => Record<string, string>;
	}>;
};

export type ScrollPosition = {
	x: number;
	y: number;
};

export type Target = {
	href: string;
	route: Route;
	match: RegExpExecArray;
	page: Page;
};

export type Redirect = {
	statusCode: number;
	location: string;
};

export type Page = {
	host: string;
	path: string;
	params: Record<string, string>;
	query: Record<string, string | string[]>;
};
