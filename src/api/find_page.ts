import { create_manifest_data } from '../core';

export function find_page(pathname: string, cwd = 'src/routes') {
	const { pages } = create_manifest_data(cwd);

	for (let i = 0; i < pages.length; i += 1) {
		const page = pages[i];

		if (page.pattern.test(pathname)) {
			return page.parts[page.parts.length - 1].component.file;
		}
	}
}
