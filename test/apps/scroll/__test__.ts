describe('scroll', function() {
	// it('scrolls to active deeplink', () => {
	// 	return nightmare
	// 		.goto(`${base}/blog/a-very-long-post#four`)
	// 		.init()
	// 		.evaluate(() => window.scrollY)
	// 		.then(scrollY => {
	// 			assert.ok(scrollY > 0, scrollY);
	// 		});
	// });

	// it('resets scroll when a link is clicked', () => {
	// 	return nightmare.goto(`${base}/blog/a-very-long-post`)
	// 		.init()
	// 		.evaluate(() => window.scrollTo(0, 200))
	// 		.click('[href="blog/another-long-post"]')
	// 		.wait(100)
	// 		.evaluate(() => window.scrollY)
	// 		.then(scrollY => {
	// 			assert.equal(scrollY, 0);
	// 		});
	// });

	// it('preserves scroll when a link with sapper-noscroll is clicked', () => {
	// 	return nightmare.goto(`${base}/blog/a-very-long-post`)
	// 		.init()
	// 		.evaluate(() => window.scrollTo(0, 200))
	// 		.click('[href="blog/another-long-post"][sapper-noscroll]')
	// 		.wait(100)
	// 		.evaluate(() => window.scrollY)
	// 		.then(scrollY => {
	// 			assert.equal(scrollY, 200);
	// 		});
	// });
});