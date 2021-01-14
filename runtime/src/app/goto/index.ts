import { cid, history, navigate, select_target } from '../router';
import { get_base_uri } from '../baseuri_helper';

export default function goto(
	href: string,
	opts: { noscroll?: boolean; replaceState?: boolean } = { noscroll: false, replaceState: false }
): Promise<void> {
	const target = select_target(new URL(href, get_base_uri(document)));

	if (target) {
		const res = navigate(target, null, opts.noscroll);
		history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
		return res;
	}

	location.href = href;
	return new Promise(() => {
		/* never resolves */
	});
}
