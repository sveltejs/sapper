import * as child_process from 'child_process';
import { CompileResult } from './core/create_compilers/interfaces';

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
	routes: string
};

export type ManifestData = {
	root: PageComponent;
	components: PageComponent[];
	pages: Page[];
	server_routes: ServerRoute[];
};

export type ReadyEvent = {
	port: number;
	process: child_process.ChildProcess;
};

export type ErrorEvent = {
	type: string;
	message: string;
};

export type FatalEvent = {
	message: string;
};

export type InvalidEvent = {
	changed: string[];
	invalid: {
		client: boolean;
		server: boolean;
		serviceworker: boolean;
	}
};

export type BuildEvent = {
	type: string;
	errors: Array<{ file: string, message: string, duplicate: boolean }>;
	warnings: Array<{ file: string, message: string, duplicate: boolean }>;
	duration: number;
	result: CompileResult;
};

export type FileEvent = {
	file: string;
	size: number;
};

export type FailureEvent = {

};

export type DoneEvent = {};