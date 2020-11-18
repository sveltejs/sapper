import {
	Manifest,
	HttpError,
	SapperHandler
} from '@sapper/internal/manifest-server';
import { PageRenderer } from './get_page_renderer';

export function get_page_handler(
	manifest: Manifest,
	render_page: PageRenderer
): SapperHandler {
	const { pages } = manifest;

	return async function find_route(req, res, next) {
		const req_path = req.path === '/service-worker-index.html' ? '/' : req.path;

		const page = pages.find(p => p.pattern.test(req_path));

		if (page) {
			try {
				await render_page(page, req, res);
			} catch (err) {
				next(err);
			}
		} else {
			const err: HttpError = new Error('Not found');
			err.statusCode = 404;
			next(err);
		}
	};
}
