import { history, select_target, navigate, cid } from '../app';

export default function goto(href: string, opts = { replaceState: false, state: {} }) {
	const target = select_target(new URL(href, document.baseURI));

	if (target) {
                const state = opts.state || {};
		history[opts.replaceState ? 'replaceState' : 'pushState']({...state, id: cid }, '', href);
		return navigate(target, null).then(() => {});
	}

	location.href = href;
	return new Promise(f => {}); // never resolves
}
