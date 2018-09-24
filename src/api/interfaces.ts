import * as child_process from 'child_process';
import { CompileResult } from '../core/create_compilers/interfaces';

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
	log?: string;
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
}

export type FileEvent = {
	file: string;
	size: number;
}

export type FailureEvent = {

}

export type DoneEvent = {};