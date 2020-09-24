function convertThrownError<T>(fn: () => T, convertError: (error: any) => Error): T {
	try {
		const result = fn();

		if (result instanceof Promise) {
			return result.catch(e => {
				throw convertError(e);
			}) as any;
		} else {
			return result;
		}
	} catch (e) {
		throw convertError(e);
	}
}

/**
 * If the code executing in fn() tries to access `window` or `document`, throw
 * an explanatory error. Also works if fn() is async.
 */
export default function detectClientOnlyReferences<T>(fn: () => T): T {
	return convertThrownError(fn, e => {
		const m = e.message.match('(document|window) is not defined');

		if (m && e.name === 'ReferenceError') {
			e.message = `Server-side code is attempting to access the global variable "${m[1]}", which is client only. See https://sapper.svelte.dev/docs/#Server-side_rendering`;
		}

		return e;
	});
}
