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