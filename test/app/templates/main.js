import { init } from '../../../runtime.js';

window.init = () => {
	init(document.querySelector('#sapper'), __routes__);
	window.READY = true;
};