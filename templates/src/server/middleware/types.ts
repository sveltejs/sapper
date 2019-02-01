import { ClientRequest, ServerResponse } from 'http';

export type ServerRoute = {
	pattern: RegExp;
	handlers: Record<string, Handler>;
	params: (match: RegExpMatchArray) => Record<string, string>;
};

export type Page = {
	pattern: RegExp;
	parts: Array<{
		name: string;
		component: Component;
		params?: (match: RegExpMatchArray) => Record<string, string>;
	}>
};

export type Manifest = {
	server_routes: ServerRoute[];
	pages: Page[];
	root: Component;
	error: Component;
}

export type Handler = (req: Req, res: Res, next: () => void) => void;

export type Store = {
	get: () => any
};

export type Props = {
	path: string;
	query: Record<string, string>;
	params: Record<string, string>;
	error?: { message: string };
	status?: number;
	child: {
		segment: string;
		component: Component;
		props: Props;
	};
	[key: string]: any;
};

export interface Req extends ClientRequest {
	url: string;
	baseUrl: string;
	originalUrl: string;
	method: string;
	path: string;
	params: Record<string, string>;
	query: Record<string, string>;
	headers: Record<string, string>;
}

export interface Res extends ServerResponse {
	write: (data: any) => void;
}

export { ServerResponse };

interface Component {
	render: (data: any, opts: { store: Store }) => {
		head: string;
		css: { code: string, map: any };
		html: string
	},
	preload: (data: any) => any | Promise<any>
}