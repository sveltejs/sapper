import * as url from 'url';

type URL = url.UrlWithStringQuery;

type FetchOpts = {
	timeout: number;
	protocol: string;
	root: URL;
	host: string;
	host_header?: string;
};

type FetchRet = {
	response: Response;
	url: URL;
};

type QueueOpts = {
	concurrent: number;
	seen: Set<any>;
	saved: Set<any>;
	fetchOpts: FetchOpts;
	handleFetch: Function;
	handleResponse: Function;
	callbacks?: {
		onDone?: () => void;
		[key: string]: Function;
	}
};

function promiseState(p: Promise<any>) {
	const t = {}
	return Promise.race([p, t]).then(v => (v === t)? "pending" : "fulfilled", () => "rejected");
}

async function findNotPendingIndex(list: Promise<any>[]) {
	for (let i = 0; i < list.length; i++) {
		const state = await promiseState(list[i]);
		if (state !== 'pending') {
			return i;
		}
	}
	return -1;
}

async function filterNotPending(list: Promise<any>[]) {
	const filtered = [];
	for (let i = 0; i < list.length; i++) {
		const state = await promiseState(list[i]);
		if (state === 'pending') {
			filtered.push(list[i]);
		}
	}
	return filtered;
}

function exportQueue({ concurrent, handleFetch, handleResponse, fetchOpts, callbacks } : QueueOpts) {
	const urls: URL[] = [];
	let fetching : Promise<any>[] = [];
	let saving : Promise<any>[] = [];

	async function processQueue() {
		// empty finished saves from saving queue
		saving = await filterNotPending(saving);

		// move resolved from fetching queue and into saving queue until saving queue is full
		let fetchedIndex = await findNotPendingIndex(fetching);
		while (saving.length < concurrent && fetchedIndex !== -1) {
			const fetched = fetching.splice(fetchedIndex, 1).pop();
			const savingPromise = new Promise((res, rej) => {
				handleResponse(fetched, fetchOpts)
					.then(() => {
						res();
						processQueue();
					})
					.catch((err: Error) => {
						rej(err);
						processQueue();
					});
			});
			saving.push(savingPromise);
			fetchedIndex = await findNotPendingIndex(fetching);
		}

		// move urls from urls queue and into fetching queue until fetching queue is full
		while (fetching.length < concurrent && urls.length) {
			const url = urls.shift();
			const fetchingPromise = new Promise((res, rej) => {
				handleFetch(url, fetchOpts)
					.then((ret: FetchRet) => {
						res(ret);
						processQueue();
					})
					.catch((err: Error) => {
						rej(err);
						processQueue();
					});
			});
			fetching.push(fetchingPromise);
		}

		if (urls.length === 0 && saving.length === 0 && fetching.length === 0) {
			return callbacks.onDone();
		}

		return urls.length + fetching.length + saving.length;
	}

	return {
		add: (url: URL) => {
			urls.push(url);
			return processQueue();
		},
		setCallback: (event: string, fn: Function) => {
			callbacks[event] = fn;
		}
	};
};

export { exportQueue, FetchOpts, FetchRet };
