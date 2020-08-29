const fs = require('fs');
const path = require('path');
const cwd = process.cwd();

export function get(req, res) {

	const { slug } = req.params;
	const image = path.join(cwd, `/content/${slug}.png`);

	const s = fs.createReadStream(image);
	s.on('open', () => {
		res.writeHead(200, { 'Content-Type': 'image/png' });
		s.pipe(res);
	});
}
