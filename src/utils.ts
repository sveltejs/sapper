export function left_pad(str: string, len: number) {
	while (str.length < len) str = ` ${str}`;
	return str;
}

export function repeat(str: string, i: number) {
	let result = '';
	while (i--) result += str;
	return result;
}