import fs from 'fs';
import { resolve } from 'url';
import express from 'express';
import serve from 'serve-static';
import sapper from '../../../dist/middleware.js';
import { Store } from 'svelte/store.js';
import { manifest } from './manifest/server.js';

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

	// set test cookie
	(req, res, next) => {
		res.setHeader('Set-Cookie', 'test=woohoo!; Max-Age=3600');
		next();
	},

	// emit messages so we can capture requests
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

	// set up some values for the store
	(req, res, next) => {
		req.hello = 'hello';
		res.locals = { name: 'world' };
		next();
	},

	sapper({
		manifest,
		store: (req, res) => {
			return new Store({
				title: `${req.hello} ${res.locals.name}`
			});
		},
		ignore: [
			/foobar/i,
			'/buzz',
			'fizz',
			x => x === '/hello'
		]
	}),
];

app.get(`${BASEPATH}/non-sapper-redirect-from`, (req, res) => {
	res.writeHead(301, {
		Location: `${BASEPATH}/non-sapper-redirect-to`
	});
	res.end();
});

if (BASEPATH) {
	app.use(BASEPATH, ...middlewares);
} else {
	app.use(...middlewares);
}

['foobar', 'buzz', 'fizzer', 'hello'].forEach(uri => {
	app.get('/'+uri, (req, res) => res.end(uri));
});

app.listen(PORT);
