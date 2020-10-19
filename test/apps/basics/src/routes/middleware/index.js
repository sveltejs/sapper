export function get(req, res, next) {
	if (req.headers.accept === 'application/json') {
		res.end('{"json":true}');
		return;
	}

	next();
}
