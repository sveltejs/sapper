let source;

console.log('!!!! hmr client');

function check() {
	if (module.hot.status() === 'idle') {
		module.hot.check(true).then(modules => {
			console.log(`HMR updated`);
		});
	}
}

export function connect(port) {
	if (source || !window.EventSource) return;

	source = new EventSource(`http://localhost:${port}/hmr`);

	source.onopen = function(event) {
		console.log(`HMR connected`);
	};

	source.onmessage = function(event) {
		const data = JSON.parse(event.data);
		if (!data) return; // just a heartbeat

		if (data.status === 'completed') {
			check();
		}
	};
}