import { writable } from 'svelte/store';

export const stores = {
	preloading: writable(null),
	page: writable(null)
};

export const CONTEXT_KEY = {};