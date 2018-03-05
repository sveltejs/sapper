import { init, prefetchRoutes } from '../../../runtime.js';
import { routes } from './manifest/client.js';

window.init = () => {
	return init(document.querySelector('#sapper'), routes);
};

window.prefetchRoutes = prefetchRoutes;