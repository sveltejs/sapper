import { detach, findAnchor, scroll_state, which } from './utils';
import { Component, ComponentConstructor, Params, Query, Route, RouteData, ScrollPosition, Store, Target } from './interfaces';

const manifest = typeof window !== 'undefined' && window.__SAPPER__;

export let App: ComponentConstructor;
export let component: Component;
let target: Node;
let store: Store;
let routes: Route[];
let errors: { '4xx': Route, '5xx': Route };

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

function select_route(url: URL): Target {
	if (url.origin !== window.location.origin) return null;
	if (!url.pathname.startsWith(manifest.baseUrl)) return null;

	const path = url.pathname.slice(manifest.baseUrl.length);

	for (const route of routes) {
		const match = route.pattern.exec(path);
		if (match) {
			if (route.ignore) return null;

			const params = route.params(match);

			const query: Record<string, string | true> = {};
			if (url.search.length > 0) {
				url.search.slice(1).split('&').forEach(searchParam => {
					const [, key, value] = /([^=]+)=(.*)/.exec(searchParam);
					query[key] = value || true;
				})
			}
			return { url, route, props: { params, query, path } };
		}
	}
}

let current_token: {};

function render(Page: ComponentConstructor, props: any, scroll: ScrollPosition, token: {}) {
	if (current_token !== token) return;

	const data = {
		Page,
		props,
		preloading: false
	};

	if (component) {
		component.set(data);
	} else {
		// first load — remove SSR'd <head> contents
		const start = document.querySelector('#sapper-head-start');
		const end = document.querySelector('#sapper-head-end');

		if (start && end) {
			while (start.nextSibling !== end) detach(start.nextSibling);
			detach(start);
			detach(end);
		}

		component = new App({
			target,
			data,
			store,
			hydrate: true
		});
	}

	if (scroll) {
		window.scrollTo(scroll.x, scroll.y);
	}
}

function prepare_route(Page: ComponentConstructor, props: RouteData) {
	let redirect: { statusCode: number, location: string } = null;
	let error: { statusCode: number, message: Error | string } = null;

	if (!Page.preload) {
		return { Page, props, redirect, error };
	}

	if (!component && manifest.preloaded) {
		return { Page, props: Object.assign(props, manifest.preloaded), redirect, error };
	}

	if (component) {
		component.set({
			preloading: true
		});
	}

	return Promise.resolve(Page.preload.call({
		store,
		fetch: (url: string, opts?: any) => window.fetch(url, opts),
		redirect: (statusCode: number, location: string) => {
			redirect = { statusCode, location };
		},
		error: (statusCode: number, message: Error | string) => {
			error = { statusCode, message };
		}
	}, props)).catch(err => {
		error = { statusCode: 500, message: err };
	}).then(preloaded => {
		if (error) {
			const route = error.statusCode >= 400 && error.statusCode < 500
				? errors['4xx']
				: errors['5xx'];

			return route.load().then(({ default: Page }: { default: ComponentConstructor }) => {
				const err = error.message instanceof Error ? error.message : new Error(error.message);
				Object.assign(props, { status: error.statusCode, error: err });
				return { Page, props, redirect: null };
			});
		}

		Object.assign(props, preloaded)
		return { Page, props, redirect };
	});
}

function navigate(target: Target, id: number): Promise<any> {
	if (id) {
		// popstate or initial navigation
		cid = id;
	} else {
		// clicked on a link. preserve scroll state
		scroll_history[cid] = scroll_state();

		id = cid = ++uid;
		scroll_history[cid] = { x: 0, y: 0 };
	}

	cid = id;

	const loaded = prefetching && prefetching.href === target.url.href ?
		prefetching.promise :
		target.route.load().then(mod => prepare_route(mod.default, target.props));

	prefetching = null;

	const token = current_token = {};

	return loaded.then(({ Page, props, redirect }) => {
		if (redirect) {
			return goto(redirect.location, { replaceState: true });
		}

		render(Page, props, scroll_history[id], token);
		document.activeElement.blur();
	});
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

	const target = select_route(url);
	if (target) {
		navigate(target, null);
		event.preventDefault();
		history.pushState({ id: cid }, '', url.href);
	}
}

function handle_popstate(event: PopStateEvent) {
	scroll_history[cid] = scroll_state();

	if (event.state) {
		const url = new URL(window.location.href);
		const target = select_route(url);
		navigate(target, event.state.id);
	} else {
		// hashchange
		cid = ++uid;
		history.replaceState({ id: cid }, '', window.location.href);
	}
}

let prefetching: {
	href: string;
	promise: Promise<{ Page: ComponentConstructor, props: any }>;
} = null;

export function prefetch(href: string) {
	const selected = select_route(new URL(href, document.baseURI));

	if (selected && (!prefetching || href !== prefetching.href)) {
		prefetching = {
			href,
			promise: selected.route.load().then(mod => prepare_route(mod.default, selected.props))
		};
	}
}

let mousemove_timeout: NodeJS.Timer;

function handle_mousemove(event: MouseEvent) {
	clearTimeout(mousemove_timeout);
	mousemove_timeout = setTimeout(() => {
		trigger_prefetch(event);
	}, 20);
}

function trigger_prefetch(event: MouseEvent | TouchEvent) {
	const a: HTMLAnchorElement = <HTMLAnchorElement>findAnchor(<Node>event.target);
	if (!a || a.rel !== 'prefetch') return;

	prefetch(a.href);
}

let inited: boolean;

export function init(opts: { App: ComponentConstructor, target: Node, routes: Route[], store?: (data: any) => Store }) {
	if (opts instanceof HTMLElement) {
		throw new Error(`The signature of init(...) has changed — see https://sapper.svelte.technology/guide#0-11-to-0-12 for more information`);
	}

	App = opts.App;
	target = opts.target;
	routes = opts.routes.filter(r => !r.error);
	errors = {
		'4xx': opts.routes.find(r => r.error === '4xx'),
		'5xx': opts.routes.find(r => r.error === '5xx')
	};

	if (opts && opts.store) {
		store = opts.store(manifest.store);
	}

	if (!inited) { // this check makes HMR possible
		window.addEventListener('click', handle_click);
		window.addEventListener('popstate', handle_popstate);

		// prefetch
		window.addEventListener('touchstart', trigger_prefetch);
		window.addEventListener('mousemove', handle_mousemove);

		inited = true;
	}

	return Promise.resolve().then(() => {
		const { hash, href } = window.location;

		const deep_linked = hash && document.getElementById(hash.slice(1));
		scroll_history[uid] = deep_linked ?
			{ x: 0, y: deep_linked.getBoundingClientRect().top } :
			scroll_state();

		history.replaceState({ id: uid }, '', href);

		const target = select_route(new URL(window.location.href));
		return navigate(target, uid);
	});
}

export function goto(href: string, opts = { replaceState: false }) {
	const target = select_route(new URL(href, document.baseURI));
	let promise;

	if (target) {
		promise = navigate(target, null);
		if (history) history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
	} else {
		window.location.href = href;
		promise = new Promise(f => {}); // never resolves
	}

	return promise;
}

export function prefetchRoutes(pathnames: string[]) {
	if (!routes) throw new Error(`You must call init() first`);

	return routes
		.filter(route => {
			if (!pathnames) return true;
			return pathnames.some(pathname => {
				return route.error
					? route.error === pathname
					: route.pattern.test(pathname)
			});
		})
		.reduce((promise: Promise<any>, route) => {
			return promise.then(route.load);
		}, Promise.resolve());
}

// remove this in 0.9
export { prefetchRoutes as preloadRoutes };