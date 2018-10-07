import sirv from 'sirv';
import polka from 'polka';
import { Store } from 'svelte/store.js';
import * as sapper from '../__sapper__/server.js';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

polka()
	.use((req, res, next) => {
		req.hello = 'hello';
		res.locals = { name: 'world' };
		next();
	})
	.use(
		sirv('static', { dev }),
		sapper.middleware({
			store: (req, res) => {
				return new Store({
					title: `${req.hello} ${res.locals.name}`
				});
			}
		})
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});
