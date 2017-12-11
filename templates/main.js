window.addEventListener('click', event => {
	let a = event.target;
	while (a && a.nodeName !== 'A') a = a.parentNode;
	if (!a) return;

	if (navigate(new URL(a.href))) event.preventDefault();
});

const target = document.querySelector('main');
let component;

function navigate(url) {
	if (url.origin !== window.location.origin) return;

	let match;
	let params = {};
	const query = {};

	function render(mod) {
		if (component) {
			component.destroy();
		} else {
			target.innerHTML = '';
		}

		component = new mod.default({
			target,
			data: { query, params },
			hydrate: !!component
		});
	}

	// ROUTES

	return true;
}

navigate(window.location);
