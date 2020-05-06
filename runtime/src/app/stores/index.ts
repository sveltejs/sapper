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

export function pageStore<T>(value: T): PageStore<T> {
	const store = writable(value);
	let ready = true;

	function notify(): void {
		ready = true;
		store.update(val => val);
	}
	
	function set(new_value: T): void {
		ready = false;
		store.set(new_value);
	}

	function subscribe(run: Subscriber<T>): Unsubscriber {
		return store.subscribe((function (val) {
			if (this.value === undefined || (ready && val !== this.value)) {
				this.value = val;
				run(val);
			}
		}).bind({}));
	}

	return { notify, set, subscribe };
}