export const CONTEXT_KEY: unknown;

export type Params = Record<string, string>;
export type Query = Record<string, string | string[]>;
export type PreloadResult = Object | Promise<Object>;
export interface Preload {
  (this: PreloadContext, page: PreloadPage, session: any): PreloadResult;
}
