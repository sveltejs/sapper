import posts from './_posts.js';

export function get(req, res) {
	const post = posts.find(post => post.slug === req.params.slug);

	if (post) {
		res.writeHead(200, {
			'Content-Type': 'application/json'
		});

		res.end(JSON.stringify(post));
	} else {
		res.writeHead(404, {
			'Content-Type': 'application/json'
		});

		res.end(JSON.stringify({ message: 'not found' }));
	}
}