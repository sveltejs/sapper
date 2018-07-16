import { detach, findAnchor, scroll_state, which } from './utils';
import { Component, ComponentConstructor, Params, Query, Redirect, Routes, RouteData, ScrollPosition, Store, Target } from './interfaces';

const initial_data = typeof window !== 'undefined' && window.__SAPPER__;

export let root: Component;
let target: Node;
let store: Store;
let routes: Routes;

export { root as component }; // legacy reasons — drop in a future version

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
	if (!url.pathname.startsWith(initial_data.baseUrl)) return null;

	const path = url.pathname.slice(initial_data.baseUrl.length);

	// avoid accidental clashes between server routes and pages
	if (routes.ignore.some(pattern => pattern.test(path))) return;

	for (let i = 0; i < routes.pages.length; i += 1) {
		const page = routes.pages[i];

		const match = page.pattern.exec(path);
		if (match) {
			const query: Record<string, string | true> = {};
			if (url.search.length > 0) {
				url.search.slice(1).split('&').forEach(searchParam => {
					const [, key, value] = /([^=]+)=(.*)/.exec(searchParam);
					query[key] = value || true;
				});
			}
			return { url, path, page, match, query };
		}
	}
}

let current_token: {};

function render(data: any, scroll: ScrollPosition, token: {}) {
	if (current_token !== token) return;

	if (root) {
		root.set(data);
	} else {
		// first load — remove SSR'd <head> contents
		const start = document.querySelector('#sapper-head-start');
		const end = document.querySelector('#sapper-head-end');

		if (start && end) {
			while (start.nextSibling !== end) detach(start.nextSibling);
			detach(start);
			detach(end);
		}

		root = new routes.root({
			target,
			data,
			store,
			hydrate: true
		});
	}

	if (scroll) {
		window.scrollTo(scroll.x, scroll.y);
	}

	ready = true;
}

function prepare_page(target: Target): Promise<{
	redirect?: Redirect;
	data?: any
}> {
	const { page, path, query } = target;

	let redirect: Redirect = null;
	let error: { statusCode: number, message: Error | string } = null;

	const preload_context = {
		store,
		fetch: (url: string, opts?: any) => window.fetch(url, opts),
		redirect: (statusCode: number, location: string) => {
			if (redirect && (redirect.statusCode !== statusCode || redirect.location !== location)) {
				throw new Error(`Conflicting redirects`);
			}
			redirect = { statusCode, location };
		},
		error: (statusCode: number, message: Error | string) => {
			error = { statusCode, message };
		}
	};

	return Promise.all(page.parts.map(async (part, i) => {
		const { default: Component } = await part.component();
		const req = {
			path,
			query,
			params: part.params ? part.params(target.match) : {}
		};

		const preloaded = ready || !initial_data.preloaded[i]
			? Component.preload ? await Component.preload.call(preload_context, req) : {}
			: initial_data.preloaded[i];

		return { Component, preloaded };
	})).catch(err => {
		error = { statusCode: 500, message: err };
		return [];
	}).then(results => {
		if (error) {
			console.error('TODO', error);
		}

		if (redirect) {
			return { redirect };
		}

		const get_params = page.parts[page.parts.length - 1].params || (() => ({}));
		const params = get_params(target.match);

		// TODO skip unchanged segments
		const props = { path, query };
		const data = { path, query, params, child: {} };
		let level = data.child;
		for (let i = 0; i < page.parts.length; i += 1) {
			const part = page.parts[i];
			const get_params = page.parts[page.parts.length - 1].params || (() => ({}));

			Object.assign(level, {
				// TODO segment
				props: Object.assign({}, props, {
					params: get_params(target.match),
				}, results[i].preloaded),
				component: results[i].Component
			});
			if (i < results.length - 1) {
				level.props.child = {};
			}
			level = level.props.child;
		}

		return { data };
	});
}

async function navigate(target: Target, id: number): Promise<any> {
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
		prepare_page(target);

	prefetching = null;

	const token = current_token = {};
	const { redirect, data } = await loaded;

	if (redirect) {
		await goto(redirect.location, { replaceState: true });
	} else {
		render(data, scroll_history[id], token);
		document.activeElement.blur();
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
		if (target) {
			navigate(target, event.state.id);
		} else {
			window.location.href = window.location.href;
		}
	} else {
		// hashchange
		cid = ++uid;
		history.replaceState({ id: cid }, '', window.location.href);
	}
}

let prefetching: {
	href: string;
	promise: Promise<{ redirect?: Redirect, data?: any }>;
} = null;

export function prefetch(href: string) {
	const target: Target = select_route(new URL(href, document.baseURI));

	if (target && (!prefetching || href !== prefetching.href)) {
		prefetching = {
			href,
			promise: prepare_page(target)
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
let ready = false;

export function init(opts: { App: ComponentConstructor, target: Node, routes: Routes, store?: (data: any) => Store }) {
	if (opts instanceof HTMLElement) {
		throw new Error(`The signature of init(...) has changed — see https://sapper.svelte.technology/guide#0-11-to-0-12 for more information`);
	}

	target = opts.target;
	routes = opts.routes;

	if (opts && opts.store) {
		store = opts.store(initial_data.store);
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
		if (target) return navigate(target, uid);
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

	return routes.pages
		.filter(route => {
			if (!pathnames) return true;
			return pathnames.some(pathname => route.pattern.test(pathname));
		})
		.reduce((promise: Promise<any>, route) => {
			return promise.then(route.load);
		}, Promise.resolve());
}

// remove this in 0.9
export { prefetchRoutes as preloadRoutes };