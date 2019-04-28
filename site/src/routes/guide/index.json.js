import sections from './_sections.js';

const dev = process.env.NODE_ENV === 'development';
let json;

export function get(req, res) {
	if (dev || !json) {
		json = JSON.stringify(sections());
	}

	res.set({
		'Content-Type': 'application/json',
		'Cache-Control': `max-age=${30 * 60 * 1e3}` // 30 minutes
	});
	res.end(json);
}