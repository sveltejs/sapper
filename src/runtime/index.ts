import { detach, findAnchor, scroll_state, which } from './utils';
import { Component, ComponentConstructor, Params, Query, Redirect, Manifest, RouteData, ScrollPosition, Store, Target } from './interfaces';

const initial_data = typeof window !== 'undefined' && window.__SAPPER__;

export let root: Component;
let target: Node;
let store: Store;
let manifest: Manifest;
let segments: string[] = [];

type RootProps = {
	path: string;
	params: Record<string, string>;
	query: Record<string, string>;
	child: Child;
};

type Child = {
	segment?: string;
	props?: any;
	component?: Component;
};

const root_props: RootProps = {
	path: null,
	params: null,
	query: null,
	child: {
		segment: null,
		component: null,
		props: {}
	}
};

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
	if (manifest.ignore.some(pattern => pattern.test(path))) return;

	for (let i = 0; i < manifest.pages.length; i += 1) {
		const page = manifest.pages[i];

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

function render(data: any, nullable_depth: number, scroll: ScrollPosition, token: {}) {
	if (current_token !== token) return;

	if (root) {
		// first, clear out highest-level root component
		let level = data.child;
		for (let i = 0; i < nullable_depth; i += 1) {
			if (i === nullable_depth) break;
			level = level.props.child;
		}

		const { component } = level;
		level.component = null;
		root.set({ child: data.child });

		// then render new stuff
		level.component = component;
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

		Object.assign(data, root_data);

		root = new manifest.root({
			target,
			data,
			store,
			hydrate: true
		});
	}

	if (scroll) {
		window.scrollTo(scroll.x, scroll.y);
	}

	Object.assign(root_props, data);
	ready = true;
}

function changed(a: Record<string, string | true>, b: Record<string, string | true>) {
	return JSON.stringify(a) !== JSON.stringify(b);
}

let root_preload: Promise<any>;
let root_data: any;

function prepare_page(target: Target): Promise<{
	redirect?: Redirect;
	data?: any;
	nullable_depth?: number;
}> {
	const { page, path, query } = target;
	const new_segments = path.split('/').filter(Boolean);
	let changed_from = 0;

	while (
		segments[changed_from] &&
		new_segments[changed_from] &&
		segments[changed_from] === new_segments[changed_from]
	) changed_from += 1;

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

	if (!root_preload) {
		root_preload = manifest.root.preload
			? initial_data.preloaded[0] || manifest.root.preload.call(preload_context, {
				path,
				query,
				params: {}
			})
			: {};
	}

	return Promise.all(page.parts.map(async (part, i) => {
		if (i < changed_from) return null;
		if (!part) return null;

		const { default: Component } = await part.component();
		const req = {
			path,
			query,
			params: part.params ? part.params(target.match) : {}
		};

		const preloaded = ready || !initial_data.preloaded[i + 1]
			? Component.preload ? await Component.preload.call(preload_context, req) : {}
			: initial_data.preloaded[i + 1];

		return { Component, preloaded };
	})).catch(err => {
		error = { statusCode: 500, message: err };
		return [];
	}).then(async results => {
		if (!root_data) root_data = await root_preload;

		if (redirect) {
			return { redirect };
		}

		segments = new_segments;

		const get_params = page.parts[page.parts.length - 1].params || (() => ({}));
		const params = get_params(target.match);

		if (error) {
			const props = {
				path,
				query,
				params,
				error: typeof error.message === 'string' ? new Error(error.message) : error.message,
				status: error.statusCode
			};

			return {
				data: Object.assign({}, props, {
					preloading: false,
					child: {
						component: manifest.error,
						props
					}
				})
			};
		}

		const props = { path, query };
		const data = {
			preloading: false,
			path,
			child: Object.assign({}, root_props.child, {
				segment: segments[0]
			})
		};
		if (changed(query, root_props.query)) data.query = query;
		if (changed(params, root_props.params)) data.params = params;

		let level = data.child;
		let nullable_depth = 0;

		for (let i = 0; i < page.parts.length; i += 1) {
			const part = page.parts[i];
			if (!part) continue;

			const get_params = part.params || (() => ({}));

			if (i < changed_from) {
				level.props.path = path;
				level.props.query = query;
				level.props.child = Object.assign({}, level.props.child);

				nullable_depth += 1;
			} else {
				level.component = results[i].Component;
				level.props = Object.assign({}, level.props, props, {
					params: get_params(target.match),
				}, results[i].preloaded);

				level.props.child = {};
			}

			level = level.props.child;
			level.segment = segments[i + 1];
		}

		return { data, nullable_depth };
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

	if (root) {
		root.set({ preloading: true });
	}
	const loaded = prefetching && prefetching.href === target.url.href ?
		prefetching.promise :
		prepare_page(target);

	prefetching = null;

	const token = current_token = {};
	const { redirect, data, nullable_depth } = await loaded;
	if (root) {
		root.set({ preloading: false });
	}

	if (redirect) {
		await goto(redirect.location, { replaceState: true });
	} else {
		render(data, nullable_depth, scroll_history[id], token);
		if (document.activeElement) document.activeElement.blur();
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
	promise: Promise<{ redirect?: Redirect, data?: any, nullable_depth?: number }>;
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

export function init(opts: {
	App: ComponentConstructor,
	target: Node,
	manifest: Manifest,
	store?: (data: any) => Store,
	routes?: any // legacy
}) {
	if (opts instanceof HTMLElement) {
		throw new Error(`The signature of init(...) has changed — see https://sapper.svelte.technology/guide#0-11-to-0-12 for more information`);
	}

	if (opts.routes) {
		throw new Error(`As of Sapper 0.15, opts.routes should be opts.manifest`);
	}

	target = opts.target;
	manifest = opts.manifest;

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

		if (!initial_data.error) {
			const target = select_route(new URL(window.location.href));
			if (target) return navigate(target, uid);
		}
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
	if (!manifest) throw new Error(`You must call init() first`);

	return manifest.pages
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