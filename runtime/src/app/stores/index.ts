/** Callback to inform of a value updates. */
type Subscriber<T> = (value: T) => void;

/** Unsubscribes from value updates. */
type Unsubscriber = () => void;

/** Writable interface for both updating and subscribing. */
interface PageStore<T> {
	/**
	 * Inform subscribers.
	 */
	notify(): void;

	/**
	 * Set value but do not inform subscribers.
	 * @param value to set
	 */
	set(value: T): void;

	/**
	 * Subscribe on value changes.
	 * @param run subscription callback
	 * @param invalidate cleanup callback
	 */
	subscribe(run: Subscriber<T>): Unsubscriber;
}

/** Pair of subscriber and invalidator. */
type SubscribeValueTuple<T> = [Subscriber<T>, T];

function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

export function pageStore<T>(value: T): PageStore<T> {
	const subscribers: Array<SubscribeValueTuple<T>> = [];
	
	function notify(): void {
		subscribers.forEach(s => { 
			if (safe_not_equal(s[1], value)) {
				s[0](value);
			}
			s[1] = value;
		});
	}
	
	function set(new_value: T): void {
		value = new_value;
	}

	function subscribe(run: Subscriber<T>): Unsubscriber {
		const subscriber: SubscribeValueTuple<T> = [run, value];
		subscribers.push(subscriber);
		run(value);

		return () => {
			const index = subscribers.indexOf(subscriber);
			if (index !== -1) {
				subscribers.splice(index, 1);
			}
		};
	}

	return { notify, set, subscribe };
}