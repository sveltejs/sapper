function createProtectedBrowserGlobal(name: string) {
	return new Proxy(
		{},
		{
			get: () => {
				const e = new Error(
					`Server-side code is attempting to access the global variable "${name}", which is client only. See https://sapper.svelte.dev/docs/#Making_a_component_SSR_compatible`
				);
				e.name = 'IllegalAccessError';

				throw e;
			}
		}
	);
}

const protectedDocument = createProtectedBrowserGlobal('document');
const protectedWindow = createProtectedBrowserGlobal('window');

function afterPromise<T>(promise: Promise<T>, onAfter: () => void): Promise<T> {
	return promise.then(
		result => {
			onAfter();

			return result;
		},
		e => {
			onAfter();

			throw e;
		}
	) as any;
}

function after<T>(fn: () => T, onAfter: () => void): T {
	let isSync = true;

	try {
		const result = fn();

		if (result instanceof Promise) {
			isSync = false;

			return afterPromise(result, onAfter) as any;
		} else {
			return result;
		}
	} finally {
		if (isSync) {
			onAfter();
		}
	}
}

/**
 * If the code executing in fn() tries to access `window` or `document`, throw
 * an explanatory error. Also works if fn() is async.
 */
export default function protectBrowserGlobals<T>(fn: () => T): T {
	const oldDocument = global['document'];
	const oldWindow = global['window'];

	global['document'] = protectedDocument;
	global['window'] = protectedWindow;

	function restore() {
		global['document'] = oldDocument;
		global['window'] = oldWindow;
	}

	return after(fn, restore);
}
