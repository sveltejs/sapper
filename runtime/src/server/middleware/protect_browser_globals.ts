
function createProtectedBrowserGlobal(name: string) {
	return new Proxy({}, {
		get: () => {
			throw new Error(`Server-side code is attempting to access the global variable "${name}", which is client only. See https://sapper.svelte.dev/docs/#Making_a_component_SSR_compatible`);
		}
	});
}

const protectedDocument = createProtectedBrowserGlobal('document');
const protectedWindow = createProtectedBrowserGlobal('window');

export default function protectBrowserGlobals<T>(fn: () => T): T {
	const oldDocument = global['document'];
	const oldWindow = global['window'];

	global['document'] = protectedDocument;
	global['window'] = protectedWindow;

	try {
		return fn();
	}
	finally {
		global['document'] = oldDocument;
		global['window'] = oldWindow;
	}
}