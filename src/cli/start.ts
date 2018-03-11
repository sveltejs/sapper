import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as clorox from 'clorox';
import * as ports from 'port-authority';

export async function start(dir: string, opts: { port: number }) {
	let port = opts.port || +process.env.PORT;

	const resolved = path.resolve(dir);
	const server = path.resolve(dir, 'server.js');

	if (!fs.existsSync(server)) {
		console.log(clorox.bold.red(`> ${dir}/server.js does not exist — type ${clorox.bold.cyan(dir === 'build' ? `npx sapper build` : `npx sapper build ${dir}`)} to create it`));
		return;
	}

	if (port) {
		if (!await ports.check(port)) {
			console.log(clorox.bold.red(`> Port ${port} is unavailable`));
			return;
		}
	} else {
		port = await ports.find(3000);
	}

	child_process.fork(server, [], {
		cwd: process.cwd(),
		env: Object.assign({
			NODE_ENV: 'production',
			PORT: port,
			SAPPER_DEST: dir
		}, process.env)
	});
}