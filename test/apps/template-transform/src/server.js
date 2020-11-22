import polka from 'polka';
import * as sapper from '@sapper/server';

import { start } from '../../common.js';

const fakeFileHash = (file) => `${file}?v=a69e2c8112ad988b3040f19aa6ceaed7`;

const dev = process.env.NODE_ENV === 'development';

sapper.registerTemplateTransformer((template, data) => 
	template
		// Totally new
		.replace('%arbitrary.globalCss%', () =>
			dev ? 'global.css' : fakeFileHash('global.css'))
	
		// Override a Sapper replacement
		.replace('%sapper.styles%', () => 
			'<style> .none-more-black {background: #000;} </style>')

		// Exact same as Sapper replacement (proving that `data.req` exists)
		.replace('%sapper.base%', () => `<base href="${data.req.baseUrl}/">`)
);

const app = polka()
	.use(sapper.middleware());

start(app);
