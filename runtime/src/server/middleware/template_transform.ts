import { SapperRequest } from '@sapper/server';

export type TransformData = Readonly<{
	html: any;
	head: any;
	styles: string;
	script: string;
	nonce_value: string;
	nonce_attr: string;
	req: SapperRequest;
}>;

export type Transformer = (body: string, data: TransformData) => string;

const transformers: Transformer[] = [
	(template, data) =>
		template
			.replace('%sapper.base%', () => `<base href="${data.req.baseUrl}/">`)
			.replace(
				'%sapper.scripts%',
				() => `<script${data.nonce_attr}>${data.script}</script>`
			)
			.replace('%sapper.html%', () => data.html)
			.replace('%sapper.head%', () => data.head)
			.replace('%sapper.styles%', () => data.styles)
			.replace(/%sapper\.cspnonce%/g, () => data.nonce_value)
];

export function registerTemplateTransformer(transformer: Transformer) {
	transformers.splice(0, 0, transformer);
}

export function transformTemplate(template: string, data: TransformData) {
	return transformers.reduce(
		(acc, transformer) => transformer(acc, data),
		template
	);
}
