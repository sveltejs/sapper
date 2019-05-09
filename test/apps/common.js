const { NODE_ENV, PORT } = process.env;

export const dev = NODE_ENV === 'development';

export function start(app) {
	const port = parseInt(PORT) || 0;

	app.listen(port, () => {
		const address = app.server.address();

		process.env.PORT = address.port;

		send({
			__sapper__: true,
			event: 'listening',
			address
		});
	});
}

const properties = ['name', 'message', 'stack', 'code', 'lineNumber', 'fileName'];

function send(message) {
	process.send && process.send(message);
}

function send_error(error) {
	send({
		__sapper__: true,
		event: 'error',
		error: properties.reduce((object, key) => ({...object, [key]: error[key]}), {})
	})
}

process.on('unhandledRejection', (reason, p) => {
	send_error(reason);
});

process.on('uncaughtException', err => {
	send_error(err);
	process.exitCode = 1;
});
