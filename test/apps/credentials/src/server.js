import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const app = polka()
	.use((req, res, next) => {
		// set test cookie
		res.setHeader('Set-Cookie', ['a=1; Max-Age=3600', 'b=2; Max-Age=3600']);
		next();
	})
	.use(sapper.middleware())

start(app);
