import * as path from 'path';
import * as ports from 'port-authority';
import { fork, ChildProcess } from 'child_process';

export class AppRunner {
	cwd: string;
	entry: string;
	port: number;
	proc: ChildProcess;

	constructor(cwd: string, entry: string) {
		this.cwd = cwd;
		this.entry = path.join(cwd, entry);
	}

	async start() {
		this.port = await ports.find(3000);

		this.proc = fork(this.entry, [], {
			cwd: this.cwd,
			env: {
				PORT: String(this.port)
			}
		});
	}

	async end() {
		return new Promise(fulfil => {
			this.proc.once('exit', fulfil);
			this.proc.kill();
		});
	}
}