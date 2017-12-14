const detach = node => {
	node.parentNode.removeChild(node);
};

let component;

const app = {
	init(target, routes) {
		function navigate(url) {
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
						// first load — remove SSR'd <head> contents
						const start = document.querySelector('#sapper-head-start');
						let end = document.querySelector('#sapper-head-end');

						if (start && end) {
							while (start.nextSibling !== end) detach(start.nextSibling);
							detach(start);
							detach(end);
						}

						// preload additional routes
						routes.reduce((promise, route) => promise.then(route.load), Promise.resolve());
					}

					component = new mod.default({
						target,
						data: Object.assign(route, preloaded),
						hydrate: !!component
					});
				});
			}

			for (let i = 0; i < routes.length; i += 1) {
				const route = routes[i];
				const match = route.pattern.exec(url.pathname);
				if (match) {
					params = route.params(match);
					route.load().then(render);
					return true;
				}
			}
		}

		window.addEventListener('click', event => {
			let a = event.target;
			while (a && a.nodeName !== 'A') a = a.parentNode;
			if (!a) return;

			if (navigate(new URL(a.href))) {
				event.preventDefault();
				history.pushState({}, '', a.href);
			}
		});

		window.addEventListener('popstate', event => {
			navigate(window.location);
		});

		navigate(window.location);
	}
};

export default app;