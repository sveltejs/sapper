import sirv from 'sirv';
import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const app = polka()
	.use(
		sirv('static', { dev: true }),
		sapper.middleware()
	)

start(app);
