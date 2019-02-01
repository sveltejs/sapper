import polka from 'polka';
import * as sapper from '../__sapper__/server.js';

const { PORT } = process.env;

polka()
	.use((req, res, next) => {
		// set test cookie
		res.setHeader('Set-Cookie', ['a=1; Max-Age=3600', 'b=2; Max-Age=3600']);
		next();
	})
	.use(sapper.middleware())
	.listen(PORT);
