import * as sapper from '@sapper/app';

window.start = () => sapper.start({
	target: document.querySelector('#sapper')
}).catch(err => {
	console.error(`OH NO! ${err.message}`);
	throw err;
}).then(() => {
	console.log(`STARTED`);
});

window.prefetchRoutes = () => sapper.prefetchRoutes();
window.prefetch = href => sapper.prefetch(href);
window.goto = href => sapper.goto(href);