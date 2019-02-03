import { writable } from 'svelte/store';

export const stores = {
	preloading: writable(false),
	page: writable(null)
};

export const CONTEXT_KEY = {};

export const preload = () => ({});