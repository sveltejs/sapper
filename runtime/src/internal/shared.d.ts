export const CONTEXT_KEY: unknown;

export type Params = Record<string, string>;
export type Query = Record<string, string | string[]>;
export type Preload = (props: { params: Params, query: Query }) => Promise<any>;
