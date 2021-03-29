export function del(req, res) {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});

	res.end(JSON.stringify({
		id: req.params.id
	}));
}
