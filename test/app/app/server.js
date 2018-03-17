import fs from 'fs';
import { resolve } from 'url';
import express from 'express';
import serve from 'serve-static';
import sapper from '../../../dist/middleware.ts.js';
import { basepath, routes } from './manifest/server.js';

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

const app = express();

const { PORT = 3000 } = process.env;

// this allows us to do e.g. `fetch('/api/blog')` on the server
const fetch = require('node-fetch');
global.fetch = (url, opts) => {
	url = resolve(`http://localhost:${PORT}${basepath}/`, url);
	return fetch(url, opts);
};

const middlewares = [
	serve('assets'),

	(req, res, next) => {
		if (!pending) return next();

		pending.add(req.url);

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
	},

	sapper({ routes })
];

if (process.env.BASEPATH) {
	app.use(process.env.BASEPATH, ...middlewares);
} else {
	app.use(...middlewares);
}

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
});