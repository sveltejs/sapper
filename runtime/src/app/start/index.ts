import {
	cid,
	history,
	initial_data,
	navigate,
	scroll_history,
	scroll_state,
	scroll_to_target,
	select_target,
	handle_error,
	set_target,
	uid,
	set_uid,
	set_cid
} from '../app';
import prefetch from '../prefetch/index';
import { extract_hash, extract_path, location_not_include_hash } from "../utils/route_path";
import { debug, init } from "svelte/internal";
import goto from "../goto";

export default function start(opts: {
	target: Node
}) {
	if ('scrollRestoration' in history) {
		history.scrollRestoration = 'manual';
	}
	
	// Adopted from Nuxt.js
	// Reset scrollRestoration to auto when leaving page, allowing page reload
	// and back-navigation from other pages to use the browser to restore the
	// scrolling position.
	addEventListener('beforeunload', () => {
		history.scrollRestoration = 'auto';
	});

	// Setting scrollRestoration to manual again when returning to this page.
	addEventListener('load', () => {
		history.scrollRestoration = 'manual';
	});

	set_target(opts.target);

	addEventListener('click', handle_click);
	addEventListener('popstate', handle_popstate);
	if (initial_data.hashbang) {
		addEventListener('hashchange', handle_hashchange);
	}

	// prefetch
	addEventListener('touchstart', trigger_prefetch);
	addEventListener('mousemove', handle_mousemove);

	return Promise.resolve().then(() => {
		const { href } = location;

		history.replaceState({ id: uid }, '', href);

		const url = new URL(location.href);

		if (initial_data.error) return handle_error(url);

		const target = select_target(url);
		const hash = extract_hash(url.hash);
		if (target) return navigate(target, uid, !initial_data.hashbang, hash);
	});
}

let mousemove_timeout: NodeJS.Timer;

function handle_mousemove(event: MouseEvent) {
	clearTimeout(mousemove_timeout);
	mousemove_timeout = setTimeout(() => {
		trigger_prefetch(event);
	}, 20);
}

function trigger_prefetch(event: MouseEvent | TouchEvent) {
	const a: HTMLAnchorElement = <HTMLAnchorElement>find_anchor(<Node>event.target);
	if (!a || a.rel !== 'prefetch') return;

	prefetch(a.href);
}

function handle_click(event: MouseEvent) {
	// Adapted from https://github.com/visionmedia/page.js
	// MIT license https://github.com/visionmedia/page.js#license
	if (which(event) !== 1) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey) return;
	if (event.defaultPrevented) return;

	const a: HTMLAnchorElement | SVGAElement = <HTMLAnchorElement | SVGAElement>find_anchor(<Node>event.target);
	if (!a) return;

	if (!a.href) return;

	// check if link is inside an svg
	// in this case, both href and target are always inside an object
	const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
	const href = String(svg ? (<SVGAElement>a).href.baseVal : a.href);

	if (href === location.href) {
		if (location_not_include_hash()) event.preventDefault();
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
	if (extract_path(url) === extract_path(location) && url.search === location.search) {
		return;
	}

	const target = select_target(url);
	if (target) {
		const noscroll = a.hasAttribute('sapper:noscroll');
		navigate(target, null, noscroll, extract_hash(url.hash));
		event.preventDefault();
		history.pushState({ id: cid }, '', url.href);
	}
}

function handle_hashchange(event: HashChangeEvent) {
	const from = new URL(event.oldURL);
	const to = new URL(event.newURL);
	const hash = extract_hash(to.hash);

	if (extract_path(from) === extract_path(to)) {
		// same page
		scroll_to_target(hash);
		return;
	}

	const target = select_target(to);

	if (target) {
		navigate(target, null, true, hash);
	}
}

function which(event: MouseEvent) {
	return event.which === null ? event.button : event.which;
}

function find_anchor(node: Node) {
	while (node && node.nodeName.toUpperCase() !== 'A') node = node.parentNode; // SVG <a> elements have a lowercase name
	return node;
}

function handle_popstate(event: PopStateEvent) {
	scroll_history[cid] = scroll_state();

	if (event.state) {
		const url = new URL(location.href);
		const target = select_target(url);
		if (target) {
			navigate(target, event.state.id);
		} else {
			location.href = location.href; // eslint-disable-line
		}
	} else {
		// hashchange
		set_uid(uid + 1);
		set_cid(uid);
		history.replaceState({ id: cid }, '', location.href);
	}
}
