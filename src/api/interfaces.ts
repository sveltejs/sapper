export type ReadyEvent = {
	port: number;
};

export type ErrorEvent = {
	type: string;
	error: Error;
};

export type FatalEvent = {
	error: Error;
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