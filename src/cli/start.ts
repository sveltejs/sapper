import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as colors from 'ansi-colors';
import * as ports from 'port-authority';

export async function start(dir: string, opts: { port: number, open: boolean }) {
	let port = opts.port || +process.env.PORT;

	const resolved = path.resolve(dir);
	const server = path.resolve(dir, 'server.js');

	if (!fs.existsSync(server)) {
		console.log(`${colors.bold.red(`> ${dir}/server.js does not exist — type ${colors.bold.cyan(dir === 'build' ? `npx sapper build` : `npx sapper build ${dir}`)} to create it`)}`);
		return;
	}

	if (port) {
		if (!await ports.check(port)) {
			console.log(`${colors.bold.red(`> Port ${port} is unavailable`)}`);
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

	await ports.wait(port);
	console.log(`${colors.bold.cyan(`> Listening on http://localhost:${port}`)}`);
	if (opts.open) child_process.exec(`open http://localhost:${port}`);
}
