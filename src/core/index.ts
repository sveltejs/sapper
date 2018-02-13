import { create_templates, render, stream } from './templates'; // TODO templates is an anomaly... fix post-#91

export { default as create_app } from './create_app';
export { default as create_assets } from './create_assets';
export { default as create_compilers } from './create_compilers';
export { default as create_routes } from './create_routes';

export const templates = { create_templates, render, stream };