import * as fs from 'fs';
import * as path from 'path';
import * as ports from 'port-authority';
import { fork, ChildProcess } from 'child_process';

export class AppRunner {
	cwd: string;
	entry: string;
	port: number;
	proc: ChildProcess;
	messages: any[];

	constructor(cwd: string, entry: string) {
		this.cwd = cwd;
		this.entry = path.join(cwd, entry);
		this.messages = [];
	}

	async start() {
		this.port = await ports.find(3000);

		this.proc = fork(this.entry, [], {
			cwd: this.cwd,
			env: {
				PORT: String(this.port)
			}
		});

		this.proc.on('message', message => {
			if (!message.__sapper__) return;
			this.messages.push(message);
		});
	}

	async end() {
		return new Promise(fulfil => {
			this.proc.once('exit', fulfil);
			this.proc.kill();
		});
	}
}

export function wait(ms: number) {
	return new Promise(fulfil => setTimeout(fulfil, ms));
}

export function walk(cwd: string, dir = cwd, files: string[] = []) {
	fs.readdirSync(dir).forEach(file => {
		const resolved = path.resolve(dir, file);
		if (fs.statSync(resolved).isDirectory()) {
			walk(cwd, resolved, files);
		} else {
			files.push(path.relative(cwd, resolved));
		}
	});

	return files;
}