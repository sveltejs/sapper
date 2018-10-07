import polka from 'polka';
import { Store } from 'svelte/store.js';
import * as sapper from '../__sapper__/server.js';

const { PORT } = process.env;

polka()
	.use((req, res, next) => {
		req.hello = 'hello';
		res.locals = { name: 'world' };
		next();
	})
	.use(
		sapper.middleware({
			store: (req, res) => {
				return new Store({
					title: `${req.hello} ${res.locals.name}`
				});
			}
		})
	)
	.listen(PORT);
