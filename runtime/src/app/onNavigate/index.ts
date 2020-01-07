import { OnNavigateCallback, Page } from '../types';

const callbacks: OnNavigateCallback[] = [];

export default function onNavigate(callback: OnNavigateCallback): () => void {
	if (!callbacks.includes(callback)) {
		callbacks.push(callback);
	}

	return () => {
		const index = callbacks.indexOf(callback);
		if (index !== -1) {
			callbacks.splice(index, 1);
		}
	};
}

export async function canNavigate(page: Page): Promise<boolean> {
	const results = await Promise.all(callbacks.map(callback => callback(page)));
	return !results.some(result => result === false);
}