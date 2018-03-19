export function get(req, res) {
	const cookies = req.headers.cookie
		? req.headers.cookie.split(/,\s+/).reduce((cookies, cookie) => {
			const [pair] = cookie.split('; ');
			const [name, value] = pair.split('=');
			cookies[name] = value;
			return cookies;
		}, {})
		: {};

	if (cookies.test) {
		res.writeHead(200, {
			'Content-Type': 'application/json'
		});

		res.end(JSON.stringify({
			message: cookies.test
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