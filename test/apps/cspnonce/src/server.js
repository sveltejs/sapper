import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const app = polka()
	.use((req, res, next) => {
		res.locals = { nonce: 'rAnd0m123'};
		next();
	})
	.use(sapper.middleware());

start(app);
