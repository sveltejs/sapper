import {
  ComponentConstructor,
  ComponentModule,
  Preload
} from './shared';

export interface ComponentLoader {
  js: () => Promise<ComponentModule>,
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
