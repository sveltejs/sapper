export const CONTEXT_KEY: unknown;

export type Params = Record<string, string>;
export type Query = Record<string, string | string[]>;
export type Preload = (props: { params: Params, query: Query }) => Promise<any>;

export interface ComponentModule {
  default: ComponentConstructor | SSRComponent
  preload?: Preload;
}

export interface DOMComponent {
	$set: (data: any) => void;
	$destroy: () => void;
}

export interface ComponentConstructor {
  new(options: { target: unknown, props: unknown, hydrate: boolean }): DOMComponent;
}

export interface SSRComponent {
  render(props: unknown): {
    html: string
    head: string
    css: { code: string, map: unknown };
  }
}
