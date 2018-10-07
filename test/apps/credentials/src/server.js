import sirv from 'sirv';
import polka from 'polka';
import * as sapper from '../__sapper__/server.js';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

polka()
	// set test cookie
	.use((req, res, next) => {
		res.setHeader('Set-Cookie', ['a=1; Max-Age=3600', 'b=2; Max-Age=3600']);
		next();
	})
	.use(
		sirv('static', { dev }),
		sapper.middleware()
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});
