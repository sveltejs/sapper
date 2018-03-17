import { init, prefetchRoutes } from '../../../runtime.js';
import { Store } from 'svelte/store.js';
import { routes } from './manifest/client.js';

window.init = () => {
	return init(document.querySelector('#sapper'), routes, {
		store: data => new Store(data)
	});
};

window.prefetchRoutes = prefetchRoutes;