import polka from 'polka';
import * as sapper from '@sapper/server';

const { PORT } = process.env;

const app = polka().use(sapper.middleware({
	ignore: [
		/foobar/i,
		'/buzz',
		'fizz',
		x => x === '/hello'
	]
}));

['foobar', 'buzz', 'fizzer', 'hello'].forEach(uri => {
	app.get('/'+uri, (req, res) => res.end(uri));
});

app.listen(PORT);
