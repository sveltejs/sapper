import { init } from '__app__';

// `routes` is an array of route objects injected by Sapper
init(document.querySelector('#sapper'), __routes__);

window.READY = true;