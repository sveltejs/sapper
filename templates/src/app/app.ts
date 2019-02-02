import App from '@sapper/App.html';
import { stores } from '@sapper/internal';
import Root from '__ROOT__';
import { preload as root_preload } from '__ROOT_PRELOAD__';
import ErrorComponent from '__ERROR__';
import {
	Target,
	ScrollPosition,
	Component,
	Redirect,
	ComponentLoader,
	ComponentConstructor,
	Route,
	Page
} from './types';
import goto from './goto';

// injected at build time
declare const __IGNORE__, __COMPONENTS__, __PAGES__, __SAPPER__;

const ignore = __IGNORE__;
export const components: ComponentLoader[] = __COMPONENTS__;
export const routes: Route[] = __PAGES__;

let ready = false;
let root_component: Component;
let current_token: {};
let root_preloaded: Promise<any>;
let current_branch = [];

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

export const initial_data = typeof __SAPPER__ !== 'undefined' && __SAPPER__;

const _history = typeof history !== 'undefined' ? history : {
	pushState: (state: any, title: string, href: string) => {},
	replaceState: (state: any, title: string, href: string) => {},
	scrollRestoration: ''
};
export { _history as history };

export const scroll_history: Record<string, ScrollPosition> = {};

export function select_target(url: URL): Target {
	if (url.origin !== location.origin) return null;
	if (!url.pathname.startsWith(initial_data.baseUrl)) return null;

	const path = url.pathname.slice(initial_data.baseUrl.length);

	// avoid accidental clashes between server routes and page routes
	if (ignore.some(pattern => pattern.test(path))) return;

	for (let i = 0; i < routes.length; i += 1) {
		const route = routes[i];

		const match = route.pattern.exec(path);
		if (match) {
			const query: Record<string, string | string[]> = Object.create(null);
			if (url.search.length > 0) {
				url.search.slice(1).split('&').forEach(searchParam => {
					let [, key, value] = /([^=]*)(?:=(.*))?/.exec(decodeURIComponent(searchParam));
					value = (value || '').replace(/\+/g, ' ');
					if (typeof query[key] === 'string') query[key] = [<string>query[key]];
					if (typeof query[key] === 'object') (query[key] as string[]).push(value);
					else query[key] = value;
				});
			}

			const part = route.parts[route.parts.length - 1];
			const params = part.params ? part.params(match) : {};

			return {
				href: url.href,
				path,
				route,
				match,
				query,
				params
			};
		}
	}
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

	if (root_component) {
		stores.preloading.set({
			// TODO path, params, query
		});
	}
	const loaded = prefetching && prefetching.href === target.href ?
		prefetching.promise :
		hydrate_target(target);

	prefetching = null;

	const token = current_token = {};
	const { redirect, page, props, branch } = await loaded;
	if (token !== current_token) return; // a secondary navigation happened while we were loading

	if (redirect) return goto(redirect.location, { replaceState: true });

	await render(branch, props, page, scroll_history[id], noscroll, hash);
	if (document.activeElement) document.activeElement.blur();
}

async function render(branch: any[], props: any, page: Page, scroll: ScrollPosition, noscroll: boolean, hash: string) {
	stores.page.set(page);
	stores.preloading.set(null);

	if (root_component) {
		root_component.props = props;
	} else {
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
			props: {
				Root,
				props,
				session: __SAPPER__.session
			},
			hydrate: true
		});
	}

	if (!noscroll) {
		if (hash) {
			// scroll is an element id (from a hash), we need to compute y.
			const deep_linked = document.querySelector(hash);

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

	current_branch = branch;
	ready = true;
}

export async function hydrate_target(target: Target): Promise<{
	redirect?: Redirect;
	props?: any;
	page?: Page;
	branch?: Array<{ Component: ComponentConstructor, preload: (page) => Promise<any>, segment: string }>
}> {
	const { route, path, query, params } = target;
	const segments = path.split('/').filter(Boolean);

	let redirect: Redirect = null;
	let error: { statusCode: number, message: Error | string } = null;

	const preload_context = {
		fetch: (url: string, opts?: any) => fetch(url, opts),
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

	if (!root_preloaded) {
		root_preloaded = initial_data.preloaded[0] || root_preload.call(preload_context, {
			path,
			query,
			params: {}
		});
	}

	let branch;

	try {
		branch = await Promise.all(route.parts.map(async (part, i) => {
			if (!part) return null;

			const segment = segments[i];
			if (current_branch[i] && current_branch[i].segment === segment) return current_branch[i];

			const { default: Component, preload } = await load_component(components[part.i]);

			let preloaded;
			if (ready || !initial_data.preloaded[i + 1]) {
				preloaded = preload
					? await preload.call(preload_context, {
						path,
						query,
						params: part.params ? part.params(target.match) : {}
					})
					: {};
			} else {
				preloaded = initial_data.preloaded[i + 1];
			}

			return { Component, preloaded, segment };
		}));
	} catch (e) {
		error = { statusCode: 500, message: e };
		branch = [];
	}

	if (redirect) return { redirect };

	const page = { path, query, params };

	if (error) {
		// TODO be nice if this was less of a special case
		return {
			page,
			props: {
				child: {
					component: ErrorComponent,
					props: {
						error: typeof error.message === 'string' ? new Error(error.message) : error.message,
						status: error.statusCode
					}
				}
			},
			branch
		};
	}

	const props = Object.assign({}, await root_preloaded, { child: {} });
	let level = props.child;

	branch.forEach(node => {
		if (!node) return;

		level.segment = node.segment;
		level.component = node.Component;
		level.props = Object.assign({}, node.preloaded, { child: {} });

		level = level.props.child;
	});

	return { props, page, branch };
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