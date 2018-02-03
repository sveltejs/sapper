import * as path from 'path';

export const dev = process.env.NODE_ENV !== 'production';

export const templates = path.resolve(process.env.SAPPER_TEMPLATES || 'templates');
export const src = path.resolve(process.env.SAPPER_ROUTES || 'routes');
export const dest = path.resolve(process.env.SAPPER_DEST || '.sapper');

export const entry = {
	client: path.resolve(templates, '.main.rendered.js'),
	server: path.resolve(dest, 'server-entry.js')
};