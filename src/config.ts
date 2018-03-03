import * as path from 'path';

export const dev = () => process.env.NODE_ENV !== 'production';
export const src = () => path.resolve(process.env.SAPPER_ROUTES || 'routes');
export const dest = () => path.resolve(process.env.SAPPER_DEST || '.sapper');
