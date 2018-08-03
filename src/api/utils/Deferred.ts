export default class Deferred {
	promise: Promise<any>;
	fulfil: (value?: any) => void;
	reject: (error: Error) => void;

	constructor() {
		this.promise = new Promise((fulfil, reject) => {
			this.fulfil = fulfil;
			this.reject = reject;
		});
	}
}