import * as glob from 'glob';
import { locations } from '../config';
import { create_routes } from '../core';

export function find_page(pathname: string, cwd = locations.routes()) {
	const { pages } = create_routes(cwd);

	for (let i = 0; i < pages.length; i += 1) {
		const page = pages[i];

		if (page.pattern.test(pathname)) {
			return page.parts[page.parts.length - 1].component.file;
		}
	}
}