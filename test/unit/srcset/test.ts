import * as assert from 'assert';
import { get_srcset_urls } from '../../../src/api/export';

describe('get_srcset_urls', () => {
	it('should parse single entry without descriptor', () => {
		const result = get_srcset_urls('<source srcset="assets/image/1.jpg"/>');
		assert.deepEqual(result, ['assets/image/1.jpg']);
	});

	it('should parse single entry with width descriptor', () => {
		const result = get_srcset_urls('<source srcset="assets/image/1.jpg 1234w"/>');
		assert.deepEqual(result, ['assets/image/1.jpg']);
	});

	it('should parse single entry with density descriptor', () => {
		const result = get_srcset_urls('<source srcset="assets/image/1.jpg -123.456x"/>');
		assert.deepEqual(result, ['assets/image/1.jpg']);
	});

	it('should parse multiple entries with different descriptors', () => {
		const result = get_srcset_urls('<source srcset="   assets/image/1.jpg -1.3E-3x,assets/image/2.jpg 2560w,assets/image/3.jpg, \nassets/image/4.jpg 2.5x  , assets/image/5.jpg 640w   "/>');
		assert.deepEqual(result, [
			'assets/image/1.jpg',
			'assets/image/2.jpg',
			'assets/image/3.jpg',
			'assets/image/4.jpg',
			'assets/image/5.jpg'
		]);
	});
});
