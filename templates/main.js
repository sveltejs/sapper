import router from 'sapper/runtime/router.js';

const target = document.querySelector('__selector__');
let component;

router.init(url => {
	if (url.origin !== window.location.origin) return;

	let match;
	let params = {};
	const query = {};

	function render(mod) {
		const route = { query, params };

		Promise.resolve(
			mod.default.preload ? mod.default.preload(route) : {}
		).then(preloaded => {
			if (component) {
				component.destroy();
			} else {
				target.innerHTML = '';
			}

			component = new mod.default({
				target,
				data: Object.assign(route, preloaded),
				hydrate: !!component
			});
		});
	}

	// ROUTES

	return true;
});