export function get(req, res) {
	res.end(req.params.rest.join(','));
}
