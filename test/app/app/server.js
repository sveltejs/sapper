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
		console.log('process received start action');
		count = 0;
		ended = false;
		process.send({ type: 'ready' });
	}

	if (message.action === 'end') {
		console.log('process received end action', count);
		ended = true;
		if (count === 0) process.send({ type: 'done' });
	}
});

const app = express();

app.use((req, res, next) => {
	console.log(`received ${req.method} request for ${req.url}`);
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

		console.log(`served ${req.url}`, count);

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