import * as net from 'net';

export function wait_for_port(port: number, cb: () => void) {
	const socket = net.createConnection({ port }, () => {
		cb();
		socket.destroy();
	});

	socket.on('error', err => {
		setTimeout(() => {
			wait_for_port(port, cb);
		}, 100);
	});

	setTimeout(() => {
		socket.destroy();
	}, 100);
}