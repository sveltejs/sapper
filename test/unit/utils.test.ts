import * as assert from 'assert';
import { normalize_path } from '../../src/utils';

describe('normalize_path', () => {
	it('lowercases the first letter', () => {
		assert.equal(normalize_path('C:\\Users\\simon\\Source\\my-app\\src\\routes\\index.svelte'),
			'c:\\Users\\simon\\Source\\my-app\\src\\routes\\index.svelte');
	});
});
