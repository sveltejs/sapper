import { getContext } from 'svelte';
import { CONTEXT_KEY } from '@sapper/internal/shared';

export const stores = () => getContext(CONTEXT_KEY);

export { default as start } from './app';
export { default as goto } from './goto/index';
export { default as prefetch } from './prefetch/index';
export { default as prefetchRoutes } from './prefetchRoutes/index';
