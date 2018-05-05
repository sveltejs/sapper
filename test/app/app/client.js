import { init, prefetchRoutes } from '../../../runtime.js';
import { Store } from 'svelte/store.js';
import { routes } from './manifest/client.js';
import App from './App.html';

window.init = () => {
	return init({
		target: document.querySelector('#sapper'),
		App,
		routes,
		store: data => new Store(data)
	});
};

window.prefetchRoutes = prefetchRoutes;