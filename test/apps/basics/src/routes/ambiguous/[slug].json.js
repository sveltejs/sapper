export function get(req, res) {
	res.end(req.params.slug);
}
