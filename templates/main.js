import app from 'sapper/runtime/app.js';
import { detachNode } from 'svelte/shared.js';

const target = document.querySelector('__selector__');
let component;

app.init(url => {
	if (url.origin !== window.location.origin) return;

	let match;
	let params = {};
	const query = {};

	function render(mod) {
		const route = { query, params };

		Promise.resolve(
			mod.default.preload ? mod.default.preload(route) : {}
		).then(preloaded => {
			if (component) {
				component.destroy();
			} else {
				// remove SSR'd <head> contents
				const start = document.querySelector('#sapper-head-start');
				let end = document.querySelector('#sapper-head-end');

				if (start && end) {
					while (start.nextSibling !== end) detachNode(start.nextSibling);
					detachNode(start);
					detachNode(end);
				}

				target.innerHTML = '';
			}

			component = new mod.default({
				target,
				data: Object.assign(route, preloaded),
				hydrate: !!component
			});
		});
	}

	// ROUTES

	return true;
});