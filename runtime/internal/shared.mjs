import { writable } from 'svelte/store';
import { noop } from 'svelte/internal';

export const stores = {
	page: process.browser ? writable(null) : frozen(null),
	preloading: writable(false),
	session: process.browser ? writable(false) : frozen(false)
};

export const preload = () => ({});

function frozen (value) {
	function reset(newValue) {
		value = newValue;
	}

	function subscribe(run) {
		run(value);
		return noop;
	}

	return { reset, subscribe };
}
