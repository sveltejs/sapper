import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const app = polka()
	.use(sapper.middleware())

start(app);
