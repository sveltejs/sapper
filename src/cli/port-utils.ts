import * as net from 'net';

export function check(port: number) {
	return new Promise(fulfil => {
		const server = net.createServer();

		server.unref();

		server.on('error', () => {
			fulfil(false);
		});

		server.listen({ port }, () => {
			server.close(() => {
				fulfil(true);
			});
		});
	});
}

export function find(port: number): Promise<number> {
	return new Promise((fulfil) => {
		get_port(port, fulfil);
	});
}

function get_port(port: number, cb: (port: number) => void) {
	const server = net.createServer();

	server.unref();

	server.on('error', () => {
		get_port(port + 1, cb);
	});

	server.listen({ port }, () => {
		server.close(() => {
			cb(port);
		});
	});
}

export function wait(port: number, timeout = 5000) {
	return new Promise((fulfil, reject) => {
		get_connection(port, fulfil);
		setTimeout(() => reject(new Error(`timed out waiting for connection`)), timeout);
	});
}

function get_connection(port: number, cb: () => void) {
	const socket = net.connect(port, 'localhost', () => {
		cb();
		socket.destroy();
	});

	socket.on('error', err => {
		setTimeout(() => {
			get_connection(port, cb);
		}, 10);
	});

	setTimeout(() => {
		socket.destroy();
	}, 1000);
}

