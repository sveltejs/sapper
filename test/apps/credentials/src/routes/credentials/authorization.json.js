export function get(req, res) {
	if (req.headers.authorization) {
		res.writeHead(200);
		res.end(JSON.stringify({
			message: req.headers.authorization
		}));
	} else {
		res.writeHead(200);
		res.end(JSON.stringify({
			message: 'unauthorized'
		}));
	}
}
