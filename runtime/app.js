const detach = node => {
	node.parentNode.removeChild(node);
};

let component;

const app = {
	init(target, routes) {
		function select_route(url) {
			if (url.origin !== window.location.origin) return null;

			for (const route of routes) {
				const match = route.pattern.exec(url.pathname);
				if (match) {
					const params = route.params(match);

					const query = {};
					for (const [key, value] of url.searchParams) query[key] = value || true;

					return { route, data: { params, query } };
				}
			}
		}

		function render(Component, data) {
			Promise.resolve(
				Component.preload ? Component.preload(data) : {}
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

				component = new Component({
					target,
					data: Object.assign(data, preloaded),
					hydrate: !!component
				});
			});
		}

		function navigate(url) {
			const selected = select_route(url);
			if (selected) {
				selected.route.load().then(mod => {
					render(mod.default, selected.data);
				});

				return true;
			}
		}

		function findAnchor(node) {
			while (node && node.nodeName !== 'A') node = node.parentNode;
			return node;
		}

		window.addEventListener('click', event => {
			const a = findAnchor(event.target);
			if (!a) return;

			if (navigate(new URL(a.href))) {
				event.preventDefault();
				history.pushState({}, '', a.href);
			}
		});

		function preload(event) {
			const a = findAnchor(event.target);
			if (!a || a.rel !== 'prefetch') return;

			const selected = select_route(new URL(a.href));

			if (selected) {
				selected.route.load().then(mod => {
					if (mod.default.preload) mod.default.preload(selected.data);
				});
			}
		}

		window.addEventListener('touchstart', preload);
		window.addEventListener('mouseover', preload);

		window.addEventListener('popstate', event => {
			navigate(new URL(window.location));
		});

		navigate(new URL(window.location));
	}
};

export default app;