import { getContext } from 'svelte';
import { CONTEXT_KEY } from '@sapper/internal';
import * as stores from '../shared/stores';

export const preloading = { subscribe: stores.preloading.subscribe };
export const page = { subscribe: stores.page.subscribe };

export const getSession = () => getContext(CONTEXT_KEY);

export { default as start } from './start/index';
export { default as goto } from './goto/index';
export { default as prefetch } from './prefetch/index';
export { default as prefetchRoutes } from './prefetchRoutes/index';