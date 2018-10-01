import { select_route, prefetching, set_prefetching, prepare_page } from '../app';
import { Target } from '../types';

export default function prefetch(href: string) {
	const target: Target = select_route(new URL(href, document.baseURI));

	if (target && (!prefetching || href !== prefetching.href)) {
		set_prefetching(href, prepare_page(target));
	}
}