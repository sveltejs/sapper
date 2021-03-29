export function get(req, res) {
	res.writeHead(200, {
		'Content-Type': 'text/html'
	});

	res.end(`
		<!doctype html>
		<html>
			<head><meta charset="utf-8"></head>
			<body>
				<h1>${req.params.slug}</h1>
			</body>
		</html>
	`);
}
