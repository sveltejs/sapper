import { init } from '__app__';

// `routes` is an array of route objects injected by Sapper
init(document.querySelector('#sapper'), __routes__);

// if (__dev__) {
// 	// Enable hot-module reloading
// 	import('sapper/webpack/hmr');
// 	if (module.hot) module.hot.accept();
// }