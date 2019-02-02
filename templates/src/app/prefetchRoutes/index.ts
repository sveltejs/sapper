import { components, routes, load_component } from "../app";

export default function prefetchRoutes(pathnames: string[]) {
	return routes
		.filter(pathnames
			? route => pathnames.some(pathname => route.pattern.test(pathname))
			: () => true
		)
		.reduce((promise: Promise<any>, route) => promise.then(() => {
			return Promise.all(route.parts.map(part => part && load_component(components[part.i])));
		}), Promise.resolve());
}