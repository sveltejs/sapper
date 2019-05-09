import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const app = polka()
	.use((req, res, next) => {
		req.hello = 'hello';
		res.locals = { name: 'world' };
		next();
	})
	.use(
		sapper.middleware({
			session: (req, res) => ({
				title: `${req.hello} ${res.locals.name}`
			})
		})
	);

start(app);
