import * as net from 'net';

export function wait_for_port(port: number, timeout = 5000) {
	return new Promise((fulfil, reject) => {
		get_connection(port, fulfil);
		setTimeout(() => reject(new Error(`timed out waiting for connection`)), timeout);
	});
}

export function get_connection(port: number, cb: () => void) {
	const socket = net.createConnection(port, 'localhost', () => {
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