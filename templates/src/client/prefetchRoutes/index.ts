import { manifest, load_component } from "../app";

export default function prefetchRoutes(pathnames: string[]) {
	if (!manifest) throw new Error(`You must call init() first`);

	return manifest.pages
		.filter(route => {
			if (!pathnames) return true;
			return pathnames.some(pathname => route.pattern.test(pathname));
		})
		.reduce((promise: Promise<any>, route) => promise.then(() => {
			return Promise.all(route.parts.map(part => part && load_component(part.component)));
		}), Promise.resolve());
}