import { history, select_target, navigate, cid } from '../app';

export default function goto(href: string, state = {}, opts = { replaceState: false }) {
	const target = select_target(new URL(href, document.baseURI));

	if (target) {
		history[opts.replaceState ? 'replaceState' : 'pushState']({...state, id: cid }, '', href);
		return navigate(target, null).then(() => {});
	}

	location.href = href;
	return new Promise(f => {}); // never resolves
}