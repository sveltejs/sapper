import {
  ComponentConstructor,
  DOMComponentModule,
  Preload
} from './shared';

export interface DOMComponentModule {
  default: ComponentConstructor;
  preload?: Preload;
}

export interface DOMComponent {
	$set: (data: any) => void;
	$destroy: () => void;
}

export interface ComponentConstructor {
  new(options: { target: Element, props: unknown, hydrate: boolean }): DOMComponent;
}

export interface ComponentLoader {
  js: () => Promise<DOMComponentModule>,
  css: string[]
}

export interface Route {
  pattern: RegExp;
  parts: Array<{
    i: number;
    params?: (match: RegExpExecArray) => Record<string, string>;
  }>;
}

export const ErrorComponent: ComponentConstructor;
export const components: ComponentLoader[];
export const ignore: RegExp[];
export const root_comp: { preload: Preload };
export const routes: Route[];
