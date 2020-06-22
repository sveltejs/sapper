export function get(req, res) {
	res.writeHead(200, {
		"Content-Type": "application/json"
	});
	const json = {
		test: 'test value'
	};
	res.end(JSON.stringify(json));
}