import polka from 'polka';
import * as sapper from '@sapper/server';
import url from 'url';

import { start } from '../../common.js';

export const loggedErrors = {};

function onError({ req, customizeResponse, statusCode, error }) {
	const parsedUrl = url.parse(req.url, true);
	const onError = parsedUrl.query['onerror'];

	if (onError == 'custom') {
		// replace normal error response with JSON response
		customizeResponse((res) => {
			res.writeHead(statusCode, {
				'Content-Type': 'application/json'
			});

			res.end(JSON.stringify({ error: error.message, custom: true }));
		});
	} else if (onError == 'log') {
		// log error so the caller can check we saw it
		loggedErrors[url.parse(req.url, true).pathname] = true;
	}
}

const app = polka().use(
	sapper.middleware({
		onError
	})
);

start(app);
