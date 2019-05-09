import * as path from 'path';
import puppeteer from 'puppeteer';
import { fork, ChildProcess } from 'child_process';
import { AddressInfo } from 'net';

import { wait } from '../utils'

const DEFAULT_ENTRY = '__sapper__/build/server/server.js';
const DELAY = parseInt(process.env.SAPPER_TEST_DELAY) || 50;

declare const start: () => Promise<void>;
declare const prefetchRoutes: () => Promise<void>;
declare const prefetch: (href: string) => Promise<void>;
declare const goto: (href: string) => Promise<void>;

export class AppRunner {
	exiting: boolean;
	terminate: Promise<any>;

	server: ChildProcess;
	address: AddressInfo;
	base: string;
	messages: any[];
	errors: Error[];

	browser: puppeteer.Browser;
	page: puppeteer.Page;

	sapper = {
		start: () => this.page.evaluate(() => start()).then(() => void 0),
		prefetchRoutes: () => this.page.evaluate(() => prefetchRoutes()).then(() => void 0),
		prefetch: (href: string) => this.page.evaluate((href: string) => prefetch(href), href).then(() => void 0),
		goto: (href: string) => this.page.evaluate((href: string) => goto(href), href).then(() => void 0)
	};

	constructor() {
		this.messages = [];
		this.errors = [];
	}

	async start(cwd: string, entry: string = DEFAULT_ENTRY) {
		const server_listening = deferred();
		const server_closed = deferred();
		const browser_closed = deferred();

		this.terminate = Promise.all([server_closed, browser_closed]);

		this.server = fork(path.join(cwd, entry), [], { cwd });
		this.server.on('exit', () => {
			server_listening.reject();
			server_closed.settle(this.exiting);
		});
		this.server.on('message', message => {
			if (!message.__sapper__) return;

			switch (message.event) {
				case 'listening':
					this.address = message.address;
					this.base = `http://localhost:${this.address.port}`;

					server_listening.resolve();
					break;

				case 'error':
					this.errors.push(Object.assign(new Error(), message.error));
					break;

				default:
					this.messages.push(message);
			}
		});

		this.browser = await puppeteer.launch({ args: ['--no-sandbox'] });
		this.browser.on('disconnected', () => browser_closed.settle(this.exiting));

		this.page = await this.browser.newPage();
		this.page.on('console', msg => {
			const text = msg.text();

			if (!text.startsWith('Failed to load resource')) {
				console.log(text);
			}
		});

		await server_listening;

		return this;
	}

	load(url: string) {
		if (url[0] === '/') {
			url = `${this.base}${url}`;
		}

		return this.page.goto(url);
	}

	text(selector: string) {
		return this.page.$eval(selector, node => node.textContent);
	}

	wait(extra_ms: number = 0) {
		return wait(DELAY + extra_ms);
	}

	capture_requests(fn: () => any): Promise<string[]> {
		return new Promise((fulfil, reject) => {
			const requests: string[] = [];
			const pending: Set<string> = new Set();
			let done = false;

			function handle_request(request: puppeteer.Request) {
				const url = request.url();
				requests.push(url);
				pending.add(url);
			}

			function handle_requestfinished(request: puppeteer.Request) {
				const url = request.url();
				pending.delete(url);

				if (done && pending.size === 0) {
					cleanup();
					fulfil(requests);
				}
			}

			function handle_requestfailed(request: puppeteer.Request) {
				cleanup();
				reject(new Error(`failed to fetch ${request.url()}`))
			}

			const cleanup = () => {
				this.page.removeListener('request', handle_request);
				this.page.removeListener('requestfinished', handle_requestfinished);
				this.page.removeListener('requestfailed', handle_requestfailed);
			};

			this.page.on('request', handle_request);
			this.page.on('requestfinished', handle_requestfinished);
			this.page.on('requestfailed', handle_requestfailed);

			return Promise.resolve(fn()).then(() => {
				if (pending.size === 0) {
					cleanup();
					fulfil(requests);
				}

				done = true;
			});
		});
	}

	async intercept_requests(interceptor: (request: puppeteer.Request) => void, fn: () => any): Promise<void> {
		const unique_interceptor = request => interceptor(request);

		this.page.prependListener('request', unique_interceptor);
		await this.page.setRequestInterception(true);

		const result = await Promise.resolve(fn());

		await this.page.setRequestInterception(false);
		this.page.removeListener('request', unique_interceptor);

		return result;
	}

	end() {
		this.exiting = true;

		this.server.kill();
		this.browser.close();

		return this.terminate;
	}
}

interface Deferred<T> extends Promise<T> {
	resolve: (value?: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
	settle: (result?: boolean) => void;
}

function settle<T>(this: Deferred<T>, result: boolean) {
	if (result) {
		this.resolve();
	} else {
		this.reject();
	}
}

function deferred<T>() {
	let resolve, reject;

	const deferred = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	}) as Deferred<T>;

	deferred.resolve = resolve;
	deferred.reject = reject;
	deferred.settle = settle;

	return deferred;
}
