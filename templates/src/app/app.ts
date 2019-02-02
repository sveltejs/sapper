import App from '@sapper/App.html';
import { stores } from '@sapper/internal';
import Root, * as RootStatic from '__ROOT__';
import ErrorComponent from '__ERROR__';
import {
	Target,
	ScrollPosition,
	Component,
	Redirect,
	ComponentLoader,
	ComponentConstructor,
	RootProps,
	Page,
	PageData
} from './types';
import goto from './goto';

const ignore = __IGNORE__;
export const components: ComponentLoader[] = __COMPONENTS__;
export const pages: Page[] = __PAGES__;

let ready = false;
let root_component: Component;
let segments: string[] = [];
let current_token: {};
let root_preload: Promise<any>;
let root_data: any;

export let prefetching: {
	href: string;
	promise: Promise<{ redirect?: Redirect, data?: any, new_segments?: any }>;
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

export function select_route(url: URL): Target {
	if (url.origin !== location.origin) return null;
	if (!url.pathname.startsWith(initial_data.baseUrl)) return null;

	const path = url.pathname.slice(initial_data.baseUrl.length);

	// avoid accidental clashes between server routes and pages
	if (ignore.some(pattern => pattern.test(path))) return;

	for (let i = 0; i < pages.length; i += 1) {
		const page = pages[i];

		const match = page.pattern.exec(path);
		if (match) {
			const query: Record<string, string | string[]> = Object.create(null);
			if (url.search.length > 0) {
				url.search.slice(1).split('&').forEach(searchParam => {
					let [, key, value] = /([^=]*)(?:=(.*))?/.exec(decodeURIComponent(searchParam));
					value = (value || '').replace(/\+/g, ' ');
					if (typeof query[key] === 'string') query[key] = [<string>query[key]];
					if (typeof query[key] === 'object') query[key].push(value);
					else query[key] = value;
				});
			}
			return { url, path, page, match, query };
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
	let scroll: ScrollPosition;
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
	const loaded = prefetching && prefetching.href === target.url.href ?
		prefetching.promise :
		prepare_page(target);

	prefetching = null;

	const token = current_token = {};

	const { redirect, page, data, new_segments, results } = await loaded;

	if (redirect) return goto(redirect.location, { replaceState: true });
	if (new_segments) segments = new_segments;

	await render(results, data, page, scroll_history[id], noscroll, hash, token);
	if (document.activeElement) document.activeElement.blur();
}

async function render(results: any[], props: any, page: PageData, scroll: ScrollPosition, noscroll: boolean, hash: string, token: {}) {
	if (current_token !== token) return;

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

		Object.assign(props, root_data); // TODO what is root_data, do we still need it?

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

	previous_thingummy = results;
	ready = true;
}

let previous_thingummy = [];

export function prepare_page(target: Target): Promise<{
	redirect?: Redirect;
	data?: any;
	page: PageData
}> {
	const { page, path, query } = target;
	const new_segments = path.split('/').filter(Boolean);
	let changed_from = 0;

	while (
		segments[changed_from] &&
		new_segments[changed_from] &&
		segments[changed_from] === new_segments[changed_from]
	) changed_from += 1;

	if (changed_from === new_segments.length) {
		changed_from -= 1;
	}

	let redirect: Redirect = null;
	let error: { statusCode: number, message: Error | string } = null;
	let page_data: PageData;

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

	if (!root_preload) {
		const preload_fn = RootStatic['pre' + 'load']; // Rollup makes us jump through these hoops :(
		root_preload = preload_fn
			? initial_data.preloaded[0] || preload_fn.call(preload_context, {
				path,
				query,
				params: {}
			})
			: {};
	}

	return Promise.all(page.parts.map((part, i) => {
		const segment = new_segments[i];

		if (i < changed_from || !part) return previous_thingummy[i];
		if (!part) return null;

		return load_component(components[part.i]).then(({ default: Component, preload }) => {
			page_data = {
				path,
				query,
				params: part.params ? part.params(target.match) : {}
			};

			let preloaded;
			if (ready || !initial_data.preloaded[i + 1]) {
				preloaded = preload
					? preload.call(preload_context, page_data)
					: {};
			} else {
				preloaded = initial_data.preloaded[i + 1];
			}

			return Promise.resolve(preloaded).then(preloaded => {
				return { Component, preloaded };
			});
		});
	})).catch(err => {
		error = { statusCode: 500, message: err };
		return [];
	}).then(results => {
		if (root_data) {
			return results;
		} else {
			return Promise.resolve(root_preload).then(value => {
				root_data = value;
				return results;
			});
		}
	}).then(results => {
		if (redirect) {
			return { redirect, new_segments, page: null };
		}

		const deepest = page.parts[page.parts.length - 1];

		const page_data = {
			path,
			query,
			params: deepest.params ? deepest.params(target.match) : {}
		};

		if (error) {
			return {
				new_segments,
				page: page_data,
				data: {
					child: {
						component: ErrorComponent,
						props: {
							error: typeof error.message === 'string' ? new Error(error.message) : error.message,
							status: error.statusCode
						}
					}
				}
			};
		}

		const props = {
			child: {
				segment: new_segments[0]
			}
		};

		let level = props.child;

		for (let i = 0; i < page.parts.length; i += 1) {
			const part = page.parts[i];
			if (!part) continue;

			level.component = results[i].Component;
			level.props = Object.assign({}, results[i].preloaded, {
				child: {}
			});

			level = level.props.child;
			level.segment = new_segments[i + 1];
		}

		return { data: props, new_segments, page: page_data, results };
	});
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