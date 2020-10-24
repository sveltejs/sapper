export function get(req, res) {
	res.writeHead(404, {
		'Content-Type': 'application/json'
	});

	res.end(JSON.stringify({
		message: 'not found'
	}));
}
