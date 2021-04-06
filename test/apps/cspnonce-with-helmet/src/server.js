import helmet from 'helmet';
import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const app = polka()
  .use((req, res, next) => {
    res.locals = { nonce: 'rAnd0m123' };
    next();
  })
  .use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["blob: 'self'", (_req, res) => `'nonce-${res.locals.nonce}'`],
          connectSrc: ["'self'", 'http://localhost:10000']
        }
      }
    }),
    sapper.middleware()
  );

start(app);
