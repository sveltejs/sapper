import polka from 'polka';
import * as sapper from '../__sapper__/server.js';

const { PORT } = process.env;

polka()
	.use(sapper.middleware())
	.listen(PORT);
