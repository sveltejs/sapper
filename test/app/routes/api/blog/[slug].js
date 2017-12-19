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
		res.set({
			'Content-Type': 'application/json',
			'Cache-Control': `max-age=${30 * 60 * 1e3}` // cache for 30 minutes
		});

		res.end(lookup[slug]);
	} else {
		next();
	}
}