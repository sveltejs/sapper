import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const app = polka()
	.use((req, res, next) => {
		if (req.headers['disable-js'] === 'true') {
			res.replacers = [doNotInsertScript]
		}
		next()
	})
	.use(sapper.middleware())

start(app);

function doNotInsertScript (ctx) {
	ctx.body = ctx.body.replace('%sapper.scripts%', '');
	return ctx;
}
