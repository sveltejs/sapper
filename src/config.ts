import * as path from 'path';

export const dev = () => process.env.NODE_ENV !== 'production';

export const locations = {
	base:   () => path.resolve(process.env.SAPPER_BASE || ''),
	app:    () => path.resolve(process.env.SAPPER_BASE || '', process.env.SAPPER_APP    || 'app'),
	routes: () => path.resolve(process.env.SAPPER_BASE || '', process.env.SAPPER_ROUTES || 'routes'),
	dest:   () => path.resolve(process.env.SAPPER_BASE || '', process.env.SAPPER_DEST   || '.sapper')
};