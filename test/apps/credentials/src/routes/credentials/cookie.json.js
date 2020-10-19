import { parse } from 'cookie';

export function get(req, res) {
	if (req.headers.cookie) {
		const cookies = parse(req.headers.cookie);
		res.writeHead(200);
		res.end(JSON.stringify({
			message: `a: ${cookies.a}, b: ${cookies.b}, max-age: ${cookies['max-age']}`
		}));
	} else {
		res.writeHead(200);
		res.end(JSON.stringify({
			message: 'unauthorized'
		}));
	}
}
