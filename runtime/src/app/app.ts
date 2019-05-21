import { writable } from 'svelte/store.mjs';
import App from '@sapper/internal/App.svelte';
import { root_preload, ErrorComponent, ignore, components, routes } from '@sapper/internal/manifest-client';
import {
	Target,
	ScrollPosition,
	Component,
	Redirect,
	ComponentLoader,
	ComponentConstructor,
	Route,
	Query,
	Page
} from './types';
import goto from './goto';

declare const __SAPPER__;
export const initial_data = typeof __SAPPER__ !== 'undefined' && __SAPPER__;

let ready = false;
let root_component: Component;
let current_token: {};
let root_preloaded: Promise<any>;
let current_branch = [];

const stores = {
	page: writable({}),
	preloading: writable(null),
	session: writable(initial_data && initial_data.session)
};

let $session;
let session_dirty: boolean;

stores.session.subscribe(async value => {
	$session = value;

	if (!ready) return;
	session_dirty = true;

	const target = select_target(new URL(location.href));

	const token = current_token = {};
	const { redirect, props, branch } = await hydrate_target(target);
	if (token !== current_token) return; // a secondary navigation happened while we were loading

	await render(redirect, branch, props, target.page);
});

export let prefetching: {
	href: string;
	promise: Promise<{ redirect?: Redirect, data?: any }>;
} = null;
export function set_prefetching(href, promise) {
	prefetching = { href, promise };
}

export let store;
export function set_store(fn) {
	store = fn(initial_data.store);
}

export let target: Node;
export function set_target(element) {
	target = element;
}

export let uid = 1;
export function set_uid(n) {
	uid = n;
}

export let cid: number;
export function set_cid(n) {
	cid = n;
}

const _history = typeof history !== 'undefined' ? history : {
	pushState: (state: any, title: string, href: string) => {},
	replaceState: (state: any, title: string, href: string) => {},
	scrollRestoration: ''
};
export { _history as history };

export const scroll_history: Record<string, ScrollPosition> = {};

export function extract_query(search: string) {
	const query = Object.create(null);
	if (search.length > 0) {
		search.slice(1).split('&').forEach(searchParam => {
			let [, key, value = ''] = /([^=]*)(?:=(.*))?/.exec(decodeURIComponent(searchParam.replace(/\+/g, ' ')));
			if (typeof query[key] === 'string') query[key] = [<string>query[key]];
			if (typeof query[key] === 'object') (query[key] as string[]).push(value);
			else query[key] = value;
		});
	}
	return query;
}

export function select_target(url: URL): Target {
	if (url.origin !== location.origin) return null;
	if (!url.pathname.startsWith(initial_data.baseUrl)) return null;

	let path = url.pathname.slice(initial_data.baseUrl.length);

	if (path === '') {
		path = '/';
	}

	// avoid accidental clashes between server routes and page routes
	if (ignore.some(pattern => pattern.test(path))) return;

	for (let i = 0; i < routes.length; i += 1) {
		const route = routes[i];

		const match = route.pattern.exec(path);

		if (match) {
			const query: Query = extract_query(url.search);
			const part = route.parts[route.parts.length - 1];
			const params = part.params ? part.params(match) : {};

			const page = { path, query, params };

			return { href: url.href, route, match, page };
		}
	}
}

export function handle_error(url: URL) {
	const { pathname, search } = location;
	const { session, preloaded, status, error } = initial_data;

	if (!root_preloaded) {
		root_preloaded = preloaded && preloaded[0]
	}

	const props = {
		error,
		status,
		session,
		level0: {
			props: root_preloaded
		},
		level1: {
			props: {
				status,
				error
			},
			component: ErrorComponent
		},
		segments: preloaded

	}
	const query = extract_query(search);
	render(null, [], props, { path: pathname, query, params: {} });
}

export function scroll_state() {
	return {
		x: pageXOffset,
		y: pageYOffset
	};
}

export async function navigate(target: Target, id: number, noscroll?: boolean, hash?: string): Promise<any> {
	if (id) {
		// popstate or initial navigation
		cid = id;
	} else {
		const current_scroll = scroll_state();

		// clicked on a link. preserve scroll state
		scroll_history[cid] = current_scroll;

		id = cid = ++uid;
		scroll_history[cid] = noscroll ? current_scroll : { x: 0, y: 0 };
	}

	cid = id;

	if (root_component) stores.preloading.set(true);

	const loaded = prefetching && prefetching.href === target.href ?
		prefetching.promise :
		hydrate_target(target);

	prefetching = null;

	const token = current_token = {};
	const { redirect, props, branch } = await loaded;
	if (token !== current_token) return; // a secondary navigation happened while we were loading

	await render(redirect, branch, props, target.page);
	if (document.activeElement) document.activeElement.blur();

	if (!noscroll) {
		let scroll = scroll_history[id];

		if (hash) {
			// scroll is an element id (from a hash), we need to compute y.
			const deep_linked = document.getElementById(hash.slice(1));

			if (deep_linked) {
				scroll = {
					x: 0,
					y: deep_linked.getBoundingClientRect().top
				};
			}
		}

		scroll_history[cid] = scroll;
		if (scroll) scrollTo(scroll.x, scroll.y);
	}
}

async function render(redirect: Redirect, branch: any[], props: any, page: Page) {
	if (redirect) return goto(redirect.location, { replaceState: true });

	stores.page.set(page);
	stores.preloading.set(false);

	if (root_component) {
		root_component.$set(props);
	} else {
		props.stores = {
			page: { subscribe: stores.page.subscribe },
			preloading: { subscribe: stores.preloading.subscribe },
			session: stores.session
		};
		props.level0 = {
			props: await root_preloaded
		};

		// first load — remove SSR'd <head> contents
		const start = document.querySelector('#sapper-head-start');
		const end = document.querySelector('#sapper-head-end');

		if (start && end) {
			while (start.nextSibling !== end) detach(start.nextSibling);
			detach(start);
			detach(end);
		}

		root_component = new App({
			target,
			props,
			hydrate: true
		});
	}

	current_branch = branch;
	ready = true;
	session_dirty = false;
}

export async function hydrate_target(target: Target): Promise<{
	redirect?: Redirect;
	props?: any;
	branch?: Array<{ Component: ComponentConstructor, preload: (page) => Promise<any>, segment: string }>;
}> {
	const { route, page } = target;
	const segments = page.path.split('/').filter(Boolean);

	let redirect: Redirect = null;

	const props = { error: null, status: 200, segments: [segments[0]] };

	const preload_context = {
		fetch: (url: string, opts?: any) => fetch(url, opts),
		redirect: (statusCode: number, location: string) => {
			if (redirect && (redirect.statusCode !== statusCode || redirect.location !== location)) {
				throw new Error(`Conflicting redirects`);
			}
			redirect = { statusCode, location };
		},
		error: (status: number, error: Error | string) => {
			props.error = typeof error === 'string' ? new Error(error) : error;
			props.status = status;
		}
	};

	if (!root_preloaded) {
		root_preloaded = initial_data.preloaded[0] || root_preload.call(preload_context, {
			path: page.path,
			query: page.query,
			params: {}
		}, $session);
	}

	let branch;
	let l = 1;

	try {
		const { pattern } = route;
		const match = pattern.exec(page.path);
		let segment_dirty = false;
		branch = await Promise.all(route.parts.map(async (part, i) => {
			const segment = segments[i];

			if (
				current_branch[i]
				&& (
					current_branch[i].segment !== segment
					|| (
						current_branch[i].match
						&& JSON.stringify(current_branch[i].match.slice(1, i+2)) !== JSON.stringify(match.slice(1, i+2))
					)
				)
			) segment_dirty = true;

			props.segments[l] = segments[i + 1]; // TODO make this less confusing
			if (!part) return { segment };

			const j = l++;

			if (!session_dirty && !segment_dirty && current_branch[i] && current_branch[i].part === part.i) {
				return current_branch[i];
			}

			segment_dirty = false;

			const { default: component, preload } = await load_component(components[part.i]);

			let preloaded;
			if (ready || !initial_data.preloaded[i + 1]) {
				preloaded = preload
					? await preload.call(preload_context, {
						path: page.path,
						query: page.query,
						params: part.params ? part.params(target.match) : {}
					}, $session)
					: {};
			} else {
				preloaded = initial_data.preloaded[i + 1];
			}

			return (props[`level${j}`] = { component, props: preloaded, segment, match, part: part.i });
		}));
	} catch (error) {
		props.error = error;
		props.status = 500;
		branch = [];
	}

	return { redirect, props, branch };
}

function load_css(chunk: string) {
	const href = `client/${chunk}`;
	if (document.querySelector(`link[href="${href}"]`)) return;

	return new Promise((fulfil, reject) => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;

		link.onload = () => fulfil();
		link.onerror = reject;

		document.head.appendChild(link);
	});
}

export function load_component(component: ComponentLoader): Promise<{
	default: ComponentConstructor,
	preload?: (input: any) => any
}> {
	// TODO this is temporary — once placeholders are
	// always rewritten, scratch the ternary
	const promises: Array<Promise<any>> = (typeof component.css === 'string' ? [] : component.css.map(load_css));
	promises.unshift(component.js());
	return Promise.all(promises).then(values => values[0]);
}

function detach(node: Node) {
	node.parentNode.removeChild(node);
}
