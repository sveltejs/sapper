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

// determines current state of a promise
function promiseState(p: Promise<any>) {
	const t = {}
	return Promise.race([p, t]).then(v => (v === t) ? "pending" : "fulfilled", () => "rejected");
}

// finds first non-pending promise in a list of promises
async function findNotPendingIndex(list: Promise<any>[]) {
	const states = await Promise.all(list.map(p => promiseState(p)));
	return states.findIndex(state => state !== 'pending');
}

// filters any non-pending promises out of a list of promises
async function filterNotPending(list: Promise<any>[]) {
	const states = await Promise.all(list.map(p => promiseState(p)));
	return states.reduce((acc, curr, index) => {
		if (curr === 'pending') {
			acc.push(list[index]);
		}
		return acc;
	}, []);
}

// sapper export queue
// uses three arrays to help alleviate io backpressure during export process
// url array can contain any number of urls found during export process
// fetching array can contain a number of fetch api returns equal to the concurrent option
// saving array can contain a number of promisified writeFile returns equal to the concurrent option
function exportQueue({ concurrent, handleFetch, handleResponse, fetchOpts, callbacks } : QueueOpts) {
	const urls: URL[] = [];
	let fetching : Promise<any>[] = [];
	let saving : Promise<any>[] = [];

	function addToQueue(p: Promise<any>, queue: Promise<any>[]) {
		const queuePromise = new Promise((res, rej) => {
			p.then((ret?: any) => {
				res(ret);
				processQueue();
			})
			.catch((err: Error) => {
				rej(err);
				processQueue();
			});
		});
		queue.push(queuePromise);
	}

	async function processQueue() {
		// empty finished saves from saving queue
		saving = await filterNotPending(saving);

		// move resolved from fetching queue and into saving queue until saving queue is full
		let fetchedIndex = await findNotPendingIndex(fetching);
		while (saving.length < concurrent && fetchedIndex !== -1) {
			const fetched = fetching.splice(fetchedIndex, 1).pop();
			addToQueue(handleResponse(fetched, fetchOpts), saving);
			fetchedIndex = await findNotPendingIndex(fetching);
		}

		// move urls from urls queue and into fetching queue until fetching queue is full
		while (fetching.length < concurrent && urls.length) {
			const url = urls.shift();
			addToQueue(handleFetch(url, fetchOpts), fetching);
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
		addSave: (p: Promise<any>) => {
			addToQueue(p, saving);
			return processQueue();
		},
		setCallback: (event: string, fn: Function) => {
			callbacks[event] = fn;
		}
	};
};

export { exportQueue, FetchOpts, FetchRet };
