import { init } from '../../../runtime.js';
import { routes } from './manifest/client.js';

window.init = () => {
	return init(document.querySelector('#sapper'), routes);
};