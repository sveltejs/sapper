import { history, select_route, navigate, cid } from '../app';

export default function goto(href: string, opts = { replaceState: false }) {
	const target = select_route(new URL(href, document.baseURI));

	if (target) {
		history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
		return navigate(target, null).then(() => {});
	}

	location.href = href;
	return new Promise(f => {}); // never resolves
}