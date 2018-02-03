import { detach, findAnchor, scroll_state, which } from './utils';
import { Component, ComponentConstructor, Params, Query, Route, RouteData, ScrollPosition } from './interfaces';

export let component: Component;
let target: Node;
let routes: Route[];

const history = typeof window !== 'undefined' ? window.history : {
	pushState: (state: any, title: string, href: string) => {},
	replaceState: (state: any, title: string, href: string) => {},
	scrollRestoration: ''
};

const scroll_history: Record<string, ScrollPosition> = {};
let uid = 1;
let cid: number;

if ('scrollRestoration' in history) {
	history.scrollRestoration = 'manual';
}

function select_route(url: URL): { route: Route, data: RouteData } {
	if (url.origin !== window.location.origin) return null;

	for (const route of routes) {
		const match = route.pattern.exec(url.pathname);
		if (match) {
			const params = route.params(match);

			const query: Record<string, string | true> = {};
			for (const [key, value] of url.searchParams) query[key] = value || true;

			return { route, data: { params, query } };
		}
	}
}

let current_token: {};

function render(Component: ComponentConstructor, data: any, scroll: ScrollPosition, token: {}) {
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
		routes.reduce((promise: Promise<any>, route) => promise.then(route.load), Promise.resolve());
	}

	component = new Component({
		target,
		data,
		hydrate: !component
	});

	if (scroll) {
		window.scrollTo(scroll.x, scroll.y);
	}
}

function prepare_route(Component: ComponentConstructor, data: RouteData) {
	if (!Component.preload) {
		return { Component, data };
	}

	if (!component && window.__SAPPER__ && window.__SAPPER__.preloaded) {
		return { Component, data: Object.assign(data, window.__SAPPER__.preloaded) };
	}

	return Promise.resolve(Component.preload(data)).then(preloaded => {
		Object.assign(data, preloaded)
		return { Component, data };
	});
}

function navigate(url: URL, id: number) {
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

		const loaded = prefetching && prefetching.href === url.href ?
			prefetching.promise :
			selected.route.load().then(mod => prepare_route(mod.default, selected.data));

		prefetching = null;

		const token = current_token = {};

		loaded.then(({ Component, data }) => {
			render(Component, data, scroll_history[id], token);
		});

		cid = id;
		return true;
	}
}

function handle_click(event: MouseEvent) {
	// Adapted from https://github.com/visionmedia/page.js
	// MIT license https://github.com/visionmedia/page.js#license
	if (which(event) !== 1) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey) return;
	if (event.defaultPrevented) return;

	const a: HTMLAnchorElement | SVGAElement = <HTMLAnchorElement | SVGAElement>findAnchor(<Node>event.target);
	if (!a) return;

	// check if link is inside an svg
	// in this case, both href and target are always inside an object
	const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
	const href = String(svg ? (<SVGAElement>a).href.baseVal : a.href);

	if (href === window.location.href) {
		event.preventDefault();
		return;
	}

	// Ignore if tag has
	// 1. 'download' attribute
	// 2. rel='external' attribute
	if (a.hasAttribute('download') || a.getAttribute('rel') === 'external') return;

	// Ignore if <a> has a target
	if (svg ? (<SVGAElement>a).target.baseVal : a.target) return;

	const url = new URL(href);

	// Don't handle hash changes
	if (url.pathname === window.location.pathname && url.search === window.location.search) return;

	if (navigate(url, null)) {
		event.preventDefault();
		history.pushState({ id: cid }, '', url.href);
	}
}

function handle_popstate(event: PopStateEvent) {
	scroll_history[cid] = scroll_state();

	if (event.state) {
		navigate(new URL(window.location.href), event.state.id);
	} else {
		// hashchange
		cid = ++uid;
		history.replaceState({ id: cid }, '', window.location.href);
	}
}

let prefetching: {
	href: string;
	promise: Promise<{ Component: ComponentConstructor, data: any }>;
} = null;

export function prefetch(href: string) {
	const selected = select_route(new URL(href));

	if (selected) {
		prefetching = {
			href,
			promise: selected.route.load().then(mod => prepare_route(mod.default, selected.data))
		};
	}
}

function handle_touchstart_mouseover(event: MouseEvent | TouchEvent) {
	const a: HTMLAnchorElement = <HTMLAnchorElement>findAnchor(<Node>event.target);
	if (!a || a.rel !== 'prefetch') return;

	prefetch(a.href);
}

let inited: boolean;

export function init(_target: Node, _routes: Route[]) {
	target = _target;
	routes = _routes;

	if (!inited) { // this check makes HMR possible
		window.addEventListener('click', handle_click);
		window.addEventListener('popstate', handle_popstate);

		// prefetch
		window.addEventListener('touchstart', handle_touchstart_mouseover);
		window.addEventListener('mouseover', handle_touchstart_mouseover);

		inited = true;
	}

	setTimeout(() => {
		const { hash, href } = window.location;

		const deep_linked = hash && document.getElementById(hash.slice(1));
		scroll_history[uid] = deep_linked ?
			{ x: 0, y: deep_linked.getBoundingClientRect().top } :
			scroll_state();

		history.replaceState({ id: uid }, '', href);
		navigate(new URL(window.location.href), uid);
	});
}

export function goto(href: string, opts = { replaceState: false }) {
	if (navigate(new URL(href, window.location.href), null)) {
		if (history) history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
	} else {
		window.location.href = href;
	}
}
