import fs from 'fs';
import polka from 'polka';
import compression from 'compression';
import serve from 'serve-static';
import sapper from '../../../middleware';
import { routes } from './manifest/server.js';

let pending;
let ended;

process.on('message', message => {
	if (message.action === 'start') {
		if (pending) {
			throw new Error(`Already capturing`);
		}

		pending = new Set();
		ended = false;
		process.send({ type: 'ready' });
	}

	if (message.action === 'end') {
		ended = true;
		if (pending.size === 0) {
			process.send({ type: 'done' });
			pending = null;
		}
	}
});

const app = polka();

app.use((req, res, next) => {
	if (pending) pending.add(req.url);

	const { write, end } = res;
	const chunks = [];

	res.write = function(chunk) {
		chunks.push(new Buffer(chunk));
		write.apply(res, arguments);
	};

	res.end = function(chunk) {
		if (chunk) chunks.push(new Buffer(chunk));
		end.apply(res, arguments);

		if (pending) pending.delete(req.url);

		process.send({
			method: req.method,
			url: req.url,
			status: res.statusCode,
			headers: res._headers,
			body: Buffer.concat(chunks).toString()
		});

		if (pending && pending.size === 0 && ended) {
			process.send({ type: 'done' });
		}
	};

	next();
});

const { PORT = 3000 } = process.env;

// this allows us to do e.g. `fetch('/api/blog')` on the server
const fetch = require('node-fetch');
global.fetch = (url, opts) => {
	if (url[0] === '/') url = `http://localhost:${PORT}${url}`;
	return fetch(url, opts);
};

app.use(compression({ threshold: 0 }));

app.use(serve('assets'));

app.use(sapper({
	routes
}));

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
});