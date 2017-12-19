const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const child_process = require('child_process');

// ensure sapper doesn't exist in app/node_modules
rimraf.sync(
	path.join(__dirname, 'app/node_modules/sapper')
);

rimraf.sync(
	path.join(__dirname, 'app/node_modules/.bin/sapper')
);

// create symlinks
fs.symlinkSync(
	path.join(__dirname, '..'),
	path.join(__dirname, 'app/node_modules/sapper')
);

fs.symlinkSync(
	path.join(__dirname, '../cli/index.js'),
	path.join(__dirname, 'app/node_modules/.bin/sapper')
);

const app_dir = path.join(__dirname, 'app');

function start_server() {
	const server = child_process.spawn(process.execPath, ['server.js'], {
		cwd: app_dir,
		env: {
			NODE_ENV: 'development'
		},
		stdio: 'pipe'
	});

	server.stdout.on('data', (data) => {
		process.stdout.write(data);
	});

	server.stderr.on('data', (data) => {
		process.stderr.write(data);
	});
}

if (process.argv[2] === '--dev') {
	start_server();
} else {
	console.log('building...')
	child_process.exec(`npm run build`, {
		cwd: app_dir,
		// env: {
		// 	PATH: `${path.resolve(app_dir, 'node_modules/.bin')}:${process.env.PATH}`
		// }
	}, (err, stdout, stderr) => {
		if (err) throw err;

		process.stdout.write(stdout);
		process.stderr.write(stderr);
		start_server();
	});
}