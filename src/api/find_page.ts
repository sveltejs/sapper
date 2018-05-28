import * as glob from 'glob';
import { locations } from '../config';
import { create_routes } from '../core';

export function find_page(pathname: string, files: string[] = glob.sync('**/*.*', { cwd: locations.routes(), dot: true, nodir: true })) {
	const routes = create_routes({ files });

	for (let i = 0; i < routes.length; i += 1) {
		const route = routes[i];

		if (route.pattern.test(pathname)) {
			const page = route.handlers.find(handler => handler.type === 'page');
			if (page) return page.file;
		}
	}
}