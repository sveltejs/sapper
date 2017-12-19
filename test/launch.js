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

function launch() {
	if (process.argv[2] === '--dev') {
		start_server();
	} else {
		child_process.exec(`npm run build`, {
			cwd: app_dir
		}, (err, stdout, stderr) => {
			if (err) throw err;

			process.stdout.write(stdout);
			process.stderr.write(stderr);
			start_server();
		});
	}
}

// this is a terrible hack
if (process.env.APPVEYOR) {
	child_process.exec(`npm install`, {
		cwd: app_dir
	}, (err, stdout, stderr) => {
		if (err) throw err;

		process.stdout.write(stdout);
		process.stderr.write(stderr);
		launch();
	});
} else {
	launch();
}