import * as assert from 'assert';
import { get_base_uri } from '../../../runtime/src/app/baseuri_helper';

interface MockDocument {
	baseURI?: string;
	getElementsByTagName?: Function;
	URL?: string;
}

interface MockWindow {
	baseURI: string;
}

interface CustomNodeJsGlobal extends NodeJS.Global {
	document: MockDocument;
	window: MockWindow;
}

declare const global: CustomNodeJsGlobal;

describe('get_base_uri', () => {
	it('document.baseURI exists', () => {
		const baseUri = 'https://baseuri.example.com';
		global.document = {
			baseURI: baseUri
		};
		assert.strictEqual(get_base_uri(), baseUri);
	});

	it('document.baseURI does not exist, with <base /> tag', () => {
		const baseUri = 'https://bytag.example.com';
		global.document = {
			getElementsByTagName: () => [
				{ href: baseUri }
			]
		};
		assert.strictEqual(get_base_uri(), baseUri);
	});

	it('document.baseURI does not exist, with multiple <base /> tag', () => {
		const baseUri = 'https://fromtag.example.com';
		global.document = {
			getElementsByTagName: () => [
				{ href: baseUri },
				{ href: 'https://ignoreme.example.com' }
			]
		};
		assert.strictEqual(get_base_uri(), baseUri);
	});

	it('document.baseURI does not exist, without <base /> tag', () => {
		const baseUri = 'https://byurl.example.com';
		global.document = {
			getElementsByTagName: () => [],
			URL: baseUri
		};
		assert.strictEqual(get_base_uri(), baseUri);
	});
});