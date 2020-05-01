import { writable, Readable } from 'svelte/store';

/** Callback to inform of a value updates. */
type Subscriber<T> = (value: T) => void;

/** Unsubscribes from value updates. */
type Unsubscriber = () => void;

/** Writable interface for both updating and subscribing. */
interface PageStore<T> extends Readable<T> {
	/**
	 * Inform subscribers.
	 */
	notify(): void;

	/**
	 * Set value and inform subscribers.
	 * @param value to set
	 */
	set(value: T): void;
}

function ignoreFirst<T>(val: T): void {
	if (this.val && this.val !== val) {
		this.run(val);
	}
	this.val = val;
}

export function pageStore<T>(value: T): PageStore<T> {
	const store = writable(value);

	function notify(): void {
		store.set(value);
	}
	
	function set(new_value: T): void {
		value = new_value;
	}

	function subscribe(run: Subscriber<T>): Unsubscriber {
		const sub = ignoreFirst.bind({ run });
		const unsubscribe = store.subscribe(sub);
		sub(value);
		return unsubscribe;
	}

	return { notify, set, subscribe };
}