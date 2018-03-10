import posts from './_posts.js';

const lookup = {};
posts.forEach(post => {
	lookup[post.slug] = JSON.stringify(post);
});

export function get(req, res, next) {
	// the `slug` parameter is available because this file
	// is called [slug].js
	const { slug } = req.params;

	if (slug in lookup) {
		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Cache-Control': `no-cache`
		});

		res.end(lookup[slug]);
	} else {
		next();
	}
}