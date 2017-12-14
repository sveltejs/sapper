import app from '__app__';

const target = document.querySelector('__selector__');
let component;

const detach = node => {
	node.parentNode.removeChild(node);
};

app.init(url => {
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
				// remove SSR'd <head> contents
				const start = document.querySelector('#sapper-head-start');
				let end = document.querySelector('#sapper-head-end');

				if (start && end) {
					while (start.nextSibling !== end) detach(start.nextSibling);
					detach(start);
					detach(end);
				}

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