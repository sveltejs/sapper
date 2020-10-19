import * as assert from 'assert';
import { get_base_uri } from '../../../runtime/src/app/baseuri_helper';

describe('get_base_uri', () => {
	it('document.baseURI exists', () => {
		const baseUri = 'https://baseuri.example.com';
		const document = {
			baseURI: baseUri
		};
		assert.strictEqual(get_base_uri(document), baseUri);
	});

	it('document.baseURI does not exist, with <base /> tag', () => {
		const baseUri = 'https://bytag.example.com';
		const document = {
			getElementsByTagName: () => [
				{ href: baseUri }
			]
		};
		assert.strictEqual(get_base_uri(document), baseUri);
	});

	it('document.baseURI does not exist, with multiple <base /> tag', () => {
		const baseUri = 'https://fromtag.example.com';
		const document = {
			getElementsByTagName: () => [
				{ href: baseUri },
				{ href: 'https://ignoreme.example.com' }
			]
		};
		assert.strictEqual(get_base_uri(document), baseUri);
	});

	it('document.baseURI does not exist, without <base /> tag', () => {
		const baseUri = 'https://byurl.example.com';
		const document = {
			getElementsByTagName: () => [],
			URL: baseUri
		};
		assert.strictEqual(get_base_uri(document), baseUri);
	});
});
