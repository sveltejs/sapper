import * as templates from './templates.js'; // TODO templates is an anomaly... fix post-#91

export { default as build } from './build.js';
export { default as export } from './export.js';
export { default as create_assets } from './create_assets.js';
export { default as create_compilers } from './create_compilers.js';
export { default as create_routes } from './create_routes.js';
export { default as create_app } from './create_app.js';

export { templates };