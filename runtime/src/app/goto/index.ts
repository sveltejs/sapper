import { history, select_target, navigate, cid } from '../app';

export default function goto(href: string, opts = { noscroll: false, replaceState: false }) {
	const target = select_target(new URL(href, document.baseURI));

	if (target) {
		history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
		return navigate(target, null, opts.noscroll).then(() => {});
	}

	location.href = href;
	return new Promise(f => {}); // never resolves
}