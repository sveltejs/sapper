import { components, routes } from '@sapper/internal/manifest-client';

export default function prefetchRoutes(pathnames: string[]): Promise<void> {
	return routes
		.filter(pathnames
			? route => pathnames.some(pathname => route.pattern.test(pathname))
			: () => true
		)
		.reduce((promise: Promise<any>, route) => promise.then(() => {
			return Promise.all(route.parts.map(part => part && components[part.i].js()));
		}), Promise.resolve());
}
