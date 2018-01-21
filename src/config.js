import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';

export const dev = process.env.NODE_ENV !== 'production';

export const templates = path.resolve(process.env.SAPPER_TEMPLATES || 'templates');

export const src = path.resolve(process.env.SAPPER_ROUTES || 'routes');

export const dest = path.resolve(process.env.SAPPER_DEST || '.sapper');

if (dev) {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));
}

export const entry = {
	client: path.resolve(templates, '.main.rendered.js'),
	server: path.resolve(dest, 'server-entry.js')
};