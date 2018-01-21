import { init } from '../../../runtime.js';

window.init = () => {
	return init(document.querySelector('#sapper'), __routes__);
};