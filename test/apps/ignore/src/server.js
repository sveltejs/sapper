import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

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

start(app);
