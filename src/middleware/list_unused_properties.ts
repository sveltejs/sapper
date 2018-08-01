export function list_unused_properties(all: any, used: any) {
	const props: string[] = [];

	const seen = new Set();

	function walk(keypath: string, a: any, b: any) {
		if (seen.has(a)) return;
		seen.add(a);

		if (!a || typeof a !== 'object') return;

		const is_array = Array.isArray(a);

		for (const key in a) {
			const child_keypath = keypath
				? is_array ? `${keypath}[${key}]` : `${keypath}.${key}`
				: key;

			if (hasProp.call(b, key)) {
				const a_child = a[key];
				const b_child = b[key];

				walk(child_keypath, a_child, b_child);
			} else {
				props.push(child_keypath);
			}
		}
	}

	walk(null, all, used);
	return props;
}

const hasProp = Object.prototype.hasOwnProperty;