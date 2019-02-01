import { components, pages, load_component } from "../app";

export default function prefetchRoutes(pathnames: string[]) {
	return pages
		.filter(route => {
			if (!pathnames) return true;
			return pathnames.some(pathname => route.pattern.test(pathname));
		})
		.reduce((promise: Promise<any>, route) => promise.then(() => {
			return Promise.all(route.parts.map(part => part && load_component(components[part.i])));
		}), Promise.resolve());
}