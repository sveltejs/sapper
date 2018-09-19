export type Route = {
	id: string;
	handlers: {
		type: 'page' | 'route';
		file: string;
	}[];
	pattern: RegExp;
	test: (url: string) => boolean;
	exec: (url: string) => Record<string, string>;
	parts: string[];
	params: string[];
};

export type Template = {
	render: (data: Record<string, string>) => string;
	stream: (req, res, data: Record<string, string | Promise<string>>) => void;
};

export type Store = {
	get: () => any;
};

export type PageComponent = {
	default?: boolean;
	name: string;
	file: string;
};

export type Page = {
	pattern: RegExp;
	parts: Array<{
		component: PageComponent;
		params: string[];
	}>
};

export type ServerRoute = {
	name: string;
	pattern: RegExp;
	file: string;
	params: string[];
};

export type Dirs = {
	dest: string,
	src: string,
	routes: string,
	webpack: string,
	rollup: string
};

export type ManifestData = {
	root: PageComponent;
	components: PageComponent[];
	pages: Page[];
	server_routes: ServerRoute[];
};