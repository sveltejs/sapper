import { initial_data } from "../app";

export function hash_is_route(hash: string) {
	return hash.startsWith('#!/');
}

export function extract_hash(hash: string) {
	if (initial_data.hashbang) {
		if (hash_is_route(hash) && hash.includes('#', 3)) {
			return hash.slice(hash.indexOf('#', 3));
		} else {
			return '';
		}
	}

	return hash;
}

export function extract_path(url: URL | Location) {
	if (initial_data.hashbang) {
		return hash_is_route(url.hash)
			? url.hash.slice(2).replace(/#.*/, '')
			: '';
	}

	return url.pathname.slice(initial_data.baseUrl.length);
}

export function location_not_include_hash() {
	return !extract_hash(location.hash);
}
