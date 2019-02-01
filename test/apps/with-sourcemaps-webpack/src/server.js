import polka from 'polka';
import * as sapper from '@sapper/server';

const { PORT } = process.env;

polka()
	.use(sapper.middleware())
	.listen(PORT);
