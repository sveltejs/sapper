import cookie from 'cookie';

export function get(req, res) {
	if (req.headers.cookie) {
		const cookies = cookie.parse(req.headers.cookie);

		res.writeHead(200, {
			'Content-Type': 'application/json'
		});

		res.end(JSON.stringify({
			message: `a: ${cookies.a}, b: ${cookies.b}, max-age: ${cookies['max-age']}`
		}));
	} else {
		res.writeHead(403, {
			'Content-Type': 'application/json'
		});

		res.end(JSON.stringify({
			message: 'unauthorized'
		}));
	}
}