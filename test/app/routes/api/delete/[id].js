export function del(req, res) {
	res.set({
		'Content-Type': 'application/json'
	});

	res.end(JSON.stringify({
		id: req.params.id
	}));
}