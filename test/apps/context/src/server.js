import polka from 'polka';
import { setContext } from 'svelte';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const app = polka()
	.use((req, res, next) => {
		req.hello = 'hello';
		res.locals = { name: 'server' };
		next();
	})
	.use(
		sapper.middleware({
			context: (req, res) => {
				setContext('title', `${req.hello} ${res.locals.name}`);
			}
		})
	);

start(app);
