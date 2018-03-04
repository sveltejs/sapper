// import waitPort from 'wait-port';

// export function wait_for_port(port: number, cb: () => void) {
// 	waitPort({ port }).then(cb);
// }

import * as net from 'net';

export function wait_for_port(port: number, cb: () => void) {
	const socket = net.createConnection(port, 'localhost', () => {
		cb();
		socket.destroy();
	});

	socket.on('error', err => {
		console.error(err.code, err);
		setTimeout(() => {
			wait_for_port(port, cb);
		}, 100);
	});

	setTimeout(() => {
		socket.destroy();
	}, 100);
}