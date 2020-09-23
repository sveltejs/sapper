import { cid, history, navigate, select_target } from '../router';

export default function goto(
		href: string,
		opts: { noscroll?: boolean, replaceState?: boolean, state?: any } = { noscroll: false, replaceState: false, state: {} }): Promise<void> {

	const target = select_target(new URL(href, document.baseURI));

	if (target) {
		history[opts.replaceState ? 'replaceState' : 'pushState']({...(opts.state || {}), id: cid }, '', href);
		return navigate(target, null, opts.noscroll).then(() => {});
	}

	location.href = href;
	return new Promise(f => {}); // never resolves
}
