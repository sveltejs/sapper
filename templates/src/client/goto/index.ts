import { select_route, navigate, cid } from '../app';

export default function goto(href: string, opts = { replaceState: false }) {
	const target = select_route(new URL(href, document.baseURI));
	let promise;

	if (target) {
		promise = navigate(target, null).then(() => {});
		if (history) history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
	} else {
		location.href = href;
		promise = new Promise(f => {}); // never resolves
	}

	return promise;
}