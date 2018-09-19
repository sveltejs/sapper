import * as path from 'path';

export const dev = () => process.env.NODE_ENV !== 'production';

export const locations = {
	base:   () => path.resolve(process.env.SAPPER_BASE || ''),
	src:    () => path.resolve(process.env.SAPPER_BASE || '', process.env.SAPPER_SRC    || 'src'),
	static: () => path.resolve(process.env.SAPPER_BASE || '', process.env.SAPPER_STATIC || 'static'),
	routes: () => path.resolve(process.env.SAPPER_BASE || '', process.env.SAPPER_ROUTES || 'src/routes'),
	dest:   () => path.resolve(process.env.SAPPER_BASE || '', process.env.SAPPER_DEST   || `.sapper/${dev() ? 'dev' : 'prod'}`)
};