import { Store } from 'svelte/store.js';
import * as sapper from '../__sapper__/client.js';

window.start = () => sapper.start({
	target: document.querySelector('#sapper'),
	store: data => new Store(data)
});

window.prefetchRoutes = () => sapper.prefetchRoutes();
window.prefetch = href => sapper.prefetch(href);
window.goto = href => sapper.goto(href);