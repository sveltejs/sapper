export function detach(node: Node) {
	node.parentNode.removeChild(node);
}

export function findAnchor(node: Node) {
	while (node && node.nodeName.toUpperCase() !== 'A') node = node.parentNode; // SVG <a> elements have a lowercase name
	return node;
}

export function which(event: MouseEvent) {
	return event.which === null ? event.button : event.which;
}

export function scroll_state() {
	return {
		x: window.scrollX,
		y: window.scrollY
	};
}