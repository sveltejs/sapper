import { sourcemap_stacktrace } from './sourcemap_stacktrace';
import {
	Manifest,
	SapperRequest,
	SapperResponse,
	SapperNext,
	SapperErrorHandler,
	dev
} from '@sapper/internal/manifest-server';
import { PageRenderer } from './get_page_renderer';

export function get_error_handler(
	manifest: Manifest,
	page_renderer: PageRenderer
): SapperErrorHandler {
	const { error_handler, error: error_route } = manifest;

	function on_error(err) {
		if (err instanceof Error && err.stack) {
			err.stack = sourcemap_stacktrace(err.stack);
		}

		console.error(err);
	}

	function render_plain(err, req, res) {
		if (!dev) {
			if (res.statusCode === 404) {
				return res.end('Not found');
			} else {
				return res.end('Internal server error');
			}
		}

		let errText = err.toString();
		if (err.stack) {
			errText += `\n${err.stack}`;
		}

		const contentType = res.getHeader('Content-Type');
		const sendsHtml = (
			!contentType ||
			contentType.toLowerCase().includes('text/html')
		);
		const needsHtml = (sendsHtml && res.headersSent);

		if (needsHtml) {
			errText = escape_html(errText);
		} else {
			res.setHeader('Content-Type', 'text/plain');
		}

		res.end(errText);
	}

	async function default_error_handler(err, req, res) {
		on_error(err);

		res.statusCode = err.status ?? err.statusCode ?? 500;

		try {
			await render_page(err, req, res);
		} catch (renderErr) {
			on_error(renderErr);
			await render_plain(err, req, res);
		}
	}

	function render_page(err, req, res) {
		return page_renderer({
			pattern: null,
			parts: [
				{ name: null, component: { default: error_route } }
			]
		}, req, res, err);
	}

	return async function handle_error(err: any, req: SapperRequest, res: SapperResponse, next: SapperNext) {
		err = err || 'Unknown error';

		if (error_handler) {
			try {
				await error_handler(err, req, res, (handler_err?: any) => {
					process.nextTick(() => default_error_handler(handler_err || err, req, res));
				});
			} catch (handler_err) {
				on_error(handler_err);

				default_error_handler(err, req, res);
			}
		} else {
			default_error_handler(err, req, res);
		}
	};
}

function escape_html(html: string) {
	const chars: Record<string, string> = {
		'"' : 'quot',
		'\'': '#39',
		'&': 'amp',
		'<' : 'lt',
		'>' : 'gt'
	};

	return html.replace(/["'&<>]/g, c => `&${chars[c]};`);
}
