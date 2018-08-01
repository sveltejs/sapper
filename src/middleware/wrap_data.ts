type Obj = Record<string, any>;

export function wrap_data(data: any) {
	const proxies = new Map();
	const clones = new Map();

	const handler = {
		get(target: any, property: string): any {
			const value = target[property];
			const intercepted = intercept(value);

			const target_clone = clones.get(target);
			const child_clone = clones.get(value);

			if (target_clone && target.hasOwnProperty(property)) {
				target_clone[property] = child_clone || value;
			}

			return intercepted;
		},
	};

	function get_or_create_proxy(obj: any) {
		if (!proxies.has(obj)) {
			proxies.set(obj, new Proxy(obj, handler));
		}

		return proxies.get(obj);
	}

	function intercept(obj: any) {
		if (clones.has(obj)) return obj;

		if (obj && typeof obj === 'object') {
			if (Array.isArray(obj)) {
				clones.set(obj, []);
				return get_or_create_proxy(obj);
			}

			else if (isPlainObject(obj)) {
				clones.set(obj, {});
				return get_or_create_proxy(obj);
			}
		}

		clones.set(obj, obj);
		return obj;
	}

	return {
		data: intercept(data),
		unwrap: () => {
			return clones.get(data);
		}
	};
}

const objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join('\0')

function isPlainObject(obj: any) {
	const proto = Object.getPrototypeOf(obj);

	if (
		proto !== Object.prototype &&
		proto !== null &&
		Object.getOwnPropertyNames(proto).sort().join('\0') !== objectProtoOwnPropertyNames
	) {
		return false;
	}

	if (Object.getOwnPropertySymbols(obj).length > 0) {
		return false;
	}

	return true;
}


function pick(obj: Obj, props: string[]) {
	const picked: Obj = {};
	props.forEach(prop => {
		picked[prop] = obj[prop];
	});
	return picked;
}