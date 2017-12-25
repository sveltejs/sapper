const detach = node => {
	node.parentNode.removeChild(node);
};

export let component;
let target;
let routes;

const history = typeof window !== 'undefined' ? window.history : {
	pushState: () => {},
	replaceState: () => {},
};

const scroll_history = {};
let uid = 1;
let cid;

if ('scrollRestoration' in history) {
	history.scrollRestoration = 'manual';
}

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

let current_token;

function render(Component, data, scroll, token) {
	Promise.resolve(
		Component.preload ? Component.preload(data) : {}
	).then(preloaded => {
		if (current_token !== token) return;

		if (component) {
			component.destroy();
		} else {
			// first load — remove SSR'd <head> contents
			const start = document.querySelector('#sapper-head-start');
			const end = document.querySelector('#sapper-head-end');

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

		if (scroll) {
			window.scrollTo(scroll.x, scroll.y);
		}
	});
}

function navigate(url, id) {
	const selected = select_route(url);
	if (selected) {
		if (id) {
			// popstate or initial navigation
			cid = id;
		} else {
			// clicked on a link. preserve scroll state
			scroll_history[cid] = scroll_state();

			id = cid = ++uid;
			scroll_history[cid] = { x: 0, y: 0 };
		}

		selected.route.load().then(mod => {
			render(mod.default, selected.data, scroll_history[id], current_token = {});
		});

		cid = id;
		return true;
	}
}

function handle_click(event) {
	// Adapted from https://github.com/visionmedia/page.js
	// MIT license https://github.com/visionmedia/page.js#license
	if (which(event) !== 1) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey) return;
	if (event.defaultPrevented) return;

	const a = findAnchor(event.target);
	if (!a) return;

	// check if link is inside an svg
	// in this case, both href and target are always inside an object
	const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
	const href = svg ? a.href.baseVal : a.href;

	if (href === window.location.href) {
		event.preventDefault();
		return;
	}

	// Ignore if tag has
	// 1. 'download' attribute
	// 2. rel='external' attribute
	if (a.hasAttribute('download') || a.getAttribute('rel') === 'external') return;

	// Ignore if <a> has a target
	if (svg ? a.target.baseVal : a.target) return;

	const url = new URL(href);

	// Don't handle hash changes
	if (url.pathname === window.location.pathname && url.search === window.location.search) return;

	if (navigate(url, null)) {
		event.preventDefault();
		history.pushState({ id: cid }, '', url.href);
	}
}

function handle_popstate(event) {
	scroll_history[cid] = scroll_state();

	if (event.state) {
		navigate(new URL(window.location), event.state.id);
	} else {
		// hashchange
		cid = ++uid;
		history.replaceState({ id: cid }, '', window.location.href);
	}
}

function prefetch(event) {
	const a = findAnchor(event.target);
	if (!a || a.rel !== 'prefetch') return;

	const selected = select_route(new URL(a.href));

	if (selected) {
		selected.route.load().then(mod => {
			if (mod.default.preload) mod.default.preload(selected.data);
		});
	}
}

function findAnchor(node) {
	while (node && node.nodeName.toUpperCase() !== 'A') node = node.parentNode; // SVG <a> elements have a lowercase name
	return node;
}

let inited;

export function init(_target, _routes) {
	target = _target;
	routes = _routes;

	if (!inited) { // this check makes HMR possible
		window.addEventListener('click', handle_click);
		window.addEventListener('popstate', handle_popstate);

		// prefetch
		window.addEventListener('touchstart', prefetch);
		window.addEventListener('mouseover', prefetch);

		inited = true;
	}

	setTimeout(() => {
		const { hash, href } = window.location;

		const deep_linked = hash && document.querySelector(hash);
		scroll_history[uid] = deep_linked ?
			{ x: 0, y: deep_linked.getBoundingClientRect().top } :
			scroll_state();

		history.replaceState({ id: uid }, '', href);
		navigate(new URL(window.location), uid);
	});
}

function which(event) {
	event = event || window.event;
	return event.which === null ? event.button : event.which;
}

function scroll_state() {
	return {
		x: window.scrollX,
		y: window.scrollY
	};
}

export function goto(href, opts = {}) {
	if (navigate(new URL(href, window.location.href))) {
		if (history) history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
	} else {
		window.location.href = href;
	}
}