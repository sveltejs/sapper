import { getContext } from 'svelte';
import { stores } from '@sapper/internal/shared';

export const preloading = { subscribe: stores.preloading.subscribe };
export const page = { subscribe: stores.page.subscribe };
export const session = stores.session

export { default as start } from './start/index';
export { default as goto } from './goto/index';
export { default as prefetch } from './prefetch/index';
export { default as prefetchRoutes } from './prefetchRoutes/index';