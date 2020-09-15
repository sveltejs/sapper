import cookie from 'cookie';
import URL from 'url';
import { Req, Res } from '@sapper/internal/manifest-server';
import fetch from 'node-fetch';

export type PreloadFetchOpts = RequestInit & { headers: { [key: string]: string }; credentials: 'include' | 'omit' };
type FetchFn = WindowOrWorkerGlobalScope['fetch'];

export function getPreloadFetch(req: Req, res: Res): FetchFn {
	return (url: string, opts?: PreloadFetchOpts) => {
		const protocol = req.socket.encrypted ? 'https' : 'http';
		const parsed = new URL.URL(
			url,
			`${protocol}://127.0.0.1:${process.env.PORT}${req.baseUrl ? req.baseUrl + '/' : ''}`
		);

		opts = Object.assign({}, opts);

		const include_credentials =
			opts.credentials === 'include' ||
			(opts.credentials !== 'omit' && parsed.origin === `${protocol}://127.0.0.1:${process.env.PORT}`);

		if (include_credentials) {
			opts.headers = Object.assign({}, opts.headers);

			const cookies = Object.assign(
				{},
				cookie.parse(req.headers.cookie || ''),
				cookie.parse(opts.headers.cookie || '')
			);

			const set_cookie = res.getHeader('Set-Cookie');
			(Array.isArray(set_cookie) ? set_cookie : [set_cookie]).forEach(str => {
				const match = /([^=]+)=([^;]+)/.exec(<string>str);
				if (match) cookies[match[1]] = match[2];
			});

			const str = Object.keys(cookies)
				.map(key => `${key}=${cookies[key]}`)
				.join('; ');

			opts.headers.cookie = str;

			if (!opts.headers.authorization && req.headers.authorization) {
				opts.headers.authorization = req.headers.authorization;
			}
		}

		return fetch(parsed.href, opts);
	};
}
