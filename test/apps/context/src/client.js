import * as sapper from '@sapper/app';
import { setContext } from 'svelte';

window.start = () => sapper.start({
	target: document.querySelector('#sapper'),
	context: () => {
		setContext('title', 'hello browser');
	}
});

window.prefetchRoutes = () => sapper.prefetchRoutes();
window.prefetch = href => sapper.prefetch(href);
window.goto = href => sapper.goto(href);