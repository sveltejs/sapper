import fs from 'fs';
import express from 'express';
import compression from 'compression';
import serve from 'serve-static';
import sapper from '../../../middleware';
import { routes } from './manifest/server.js';

let count;
let ended;

process.on('message', message => {
	if (message.action === 'start') {
		count = 0;
		ended = false;
		process.send({ type: 'ready' });
	}

	if (message.action === 'end') {
		ended = true;
		if (count === 0) process.send({ type: 'done' });
	}
});

const app = express();

app.use((req, res, next) => {
	count += 1;

	const { write, end } = res;
	const chunks = [];

	res.write = function(chunk) {
		chunks.push(new Buffer(chunk));
		write.apply(res, arguments);
	};

	res.end = function(chunk) {
		if (chunk) chunks.push(new Buffer(chunk));
		end.apply(res, arguments);

		count -= 1;

		process.send({
			method: req.method,
			url: req.url,
			status: res.statusCode,
			headers: res._headers,
			body: Buffer.concat(chunks).toString()
		});

		if (count === 0 && ended) {
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