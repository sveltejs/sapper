import sirv from 'sirv';
import polka from 'polka';
import * as sapper from '../__sapper__/server.js';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

const app = polka();

app.use(
	sirv('static', { dev }),
	sapper.middleware({
		ignore: [
			/foobar/i,
			'/buzz',
			'fizz',
			x => x === '/hello'
		]
	})
);

['foobar', 'buzz', 'fizzer', 'hello'].forEach(uri => {
	app.get('/'+uri, (req, res) => res.end(uri));
});

app.listen(PORT, err => {
	if (err) console.log('error', err);
});
