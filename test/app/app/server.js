import fs from 'fs';
import { resolve } from 'url';
import express from 'express';
import serve from 'serve-static';
import sapper from '../../../dist/middleware.ts.js';
import { Store } from 'svelte/store.js';
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

const app = express();

const { PORT = 3000, BASEPATH = '' } = process.env;
const base = `http://localhost:${PORT}${BASEPATH}/`;

// this allows us to do e.g. `fetch('/api/blog')` on the server
const fetch = require('node-fetch');
global.fetch = (url, opts) => {
	return fetch(resolve(base, url), opts);
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

	sapper({
		routes,
		store: () => {
			return new Store({
				title: 'Stored title'
			});
		}
	})
];

if (BASEPATH) {
	app.use(BASEPATH, ...middlewares);
} else {
	app.use(...middlewares);
}

app.listen(PORT);