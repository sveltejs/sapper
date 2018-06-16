import * as child_process from 'child_process';

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
	errors: Array<{ message: string, duplicate: boolean }>;
	warnings: Array<{ message: string, duplicate: boolean }>;
	duration: number;
	webpack_stats: any;
}

export type FileEvent = {
	file: string;
	size: number;
}

export type FailureEvent = {

}

export type DoneEvent = {}