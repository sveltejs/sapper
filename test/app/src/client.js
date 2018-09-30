import { Store } from 'svelte/store.js';
import * as sapper from '../__sapper__/client.js';

window.init = () => {
	return sapper.start({
		target: document.querySelector('#sapper'),
		store: data => new Store(data)
	});
};

window.prefetchRoutes = sapper.prefetchRoutes;
window.goto = sapper.goto;