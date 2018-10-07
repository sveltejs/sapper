import * as sapper from '../__sapper__/client.js';

window.start = () => sapper.start({
	target: document.querySelector('#sapper')
});

window.prefetchRoutes = () => sapper.prefetchRoutes();
window.prefetch = href => sapper.prefetch(href);
window.goto = href => sapper.goto(href);