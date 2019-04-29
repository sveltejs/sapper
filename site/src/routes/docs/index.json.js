import send from '@polka/send';
import get_sections from './_sections.js';

let json;

export function get(req, res) {
	if (!json || process.env.NODE_ENV !== 'production') {
		json = JSON.stringify(get_sections()); // TODO it errors if I send the non-stringified value
	}

	send(res, 200, json, {
		'Content-Type': 'application/json'
	});
}
