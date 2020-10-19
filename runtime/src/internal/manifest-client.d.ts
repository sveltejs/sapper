import { PageParams } from '@sapper/common';
import {
	Preload
} from './shared';

export interface DOMComponentModule {
	default: DOMComponentConstructor;
	preload?: Preload;
}

export interface DOMComponent {
	$set: (data: any) => void;
	$destroy: () => void;
}

export interface DOMComponentConstructor {
	new(options: { target: Element, props: unknown, hydrate: boolean }): DOMComponent;
}

export interface DOMComponentLoader {
	js: () => Promise<DOMComponentModule>
}

export interface Route {
	pattern: RegExp;
	parts: Array<{
		i: number;
		params?: (match: RegExpExecArray) => PageParams;
	}>;
}

export const ErrorComponent: DOMComponentConstructor;
export const components: DOMComponentLoader[];
export const ignore: RegExp[];
export const root_comp: { preload: Preload };
export const routes: Route[];
