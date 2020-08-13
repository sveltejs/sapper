import { ClientRequest, ServerResponse } from 'http';
import { TLSSocket } from 'tls';
import {
  ComponentModule,
  SSRComponent
} from './shared';

export const src_dir: string;
export const build_dir: string;
export const dev: boolean;
export const manifest: Manifest;

export interface Manifest {
  server_routes: ServerRoute[];
  ignore: RegExp[];
  root_comp: ComponentModule
  error: SSRComponent
  pages: ManifestPage[]
}

export interface ManifestPage {
  pattern: RegExp | null;
  parts: ManifestPagePart[];
}

export interface ManifestPagePart {
  name: string | null;
  file?: string;
  component: ComponentModule;
  params?: (match: RegExpMatchArray | null) => Record<string, string>;
}

export type Handler = (req: Req, res: Res, next: () => void) => void;

export interface Req extends ClientRequest {
	url: string;
	baseUrl: string;
	originalUrl: string;
	method: string;
	path: string;
	params: Record<string, string>;
	query: Record<string, string>;
	headers: Record<string, string>;
	socket: TLSSocket;
}

export interface Res extends ServerResponse {
	write: (data: any) => boolean;
	locals?: {
		nonce?: string;
		name?: string;
	};
}

export interface ServerRoute {
  pattern: RegExp;
  handlers: Record<string, Handler>;
  params: (match: RegExpMatchArray) => Record<string, string>;
}
