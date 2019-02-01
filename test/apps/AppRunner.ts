import * as path from 'path';
import * as puppeteer from 'puppeteer';
import * as ports from 'port-authority';
import { fork, ChildProcess } from 'child_process';

declare const start: () => Promise<void>;
declare const prefetchRoutes: () => Promise<void>;
declare const prefetch: (href: string) => Promise<void>;
declare const goto: (href: string) => Promise<void>;

type StartOpts = {
	requestInterceptor?: (interceptedRequst: puppeteer.Request) => any
};

export class AppRunner {
	cwd: string;
	entry: string;
	port: number;
	proc: ChildProcess;
	messages: any[];

	browser: puppeteer.Browser;
	page: puppeteer.Page;

	constructor(cwd: string, entry: string) {
		this.cwd = cwd;
		this.entry = path.join(cwd, entry);
		this.messages = [];
	}

	async start({ requestInterceptor }: StartOpts = {}) {
		this.port = await ports.find(3000);

		this.proc = fork(this.entry, [], {
			cwd: this.cwd,
			env: {
				PORT: String(this.port)
			}
		});

		this.proc.on('message', message => {
			if (!message.__sapper__) return;
			this.messages.push(message);
		});

		this.browser = await puppeteer.launch({ args: ['--no-sandbox'] });

		this.page = await this.browser.newPage();
		this.page.on('console', msg => {
			const text = msg.text();

			if (!text.startsWith('Failed to load resource')) {
				console.log(text);
			}
		});

		if (requestInterceptor) {
			await this.page.setRequestInterception(true);
			this.page.on('request', requestInterceptor);
		}

		return {
			page: this.page,
			base: `http://localhost:${this.port}`,

			// helpers
			start: () => this.page.evaluate(() => start()),
			prefetchRoutes: () => this.page.evaluate(() => prefetchRoutes()),
			prefetch: (href: string) => this.page.evaluate((href: string) => prefetch(href), href),
			goto: (href: string) => this.page.evaluate((href: string) => goto(href), href),
			title: () => this.page.$eval('h1', node => node.textContent)
		};
	}

	capture(fn: () => any): Promise<string[]> {
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

	end() {
		return Promise.all([
			this.browser.close(),
			new Promise(fulfil => {
				this.proc.once('exit', fulfil);
				this.proc.kill();
			})
		]);
	}
}