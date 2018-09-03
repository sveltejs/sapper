import { init, goto, prefetchRoutes } from '../../../runtime.js';
import { Store } from 'svelte/store.js';
import { manifest } from './manifest/client.js';

window.init = () => {
	return init({
		target: document.querySelector('#sapper'),
		manifest,
		store: data => new Store(data)
	});
};

window.prefetchRoutes = prefetchRoutes;
window.goto = goto;