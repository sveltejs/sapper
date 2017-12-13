const router = {
	init(callback) {
		console.log('initing');
		window.addEventListener('click', event => {
			let a = event.target;
			while (a && a.nodeName !== 'A') a = a.parentNode;
			if (!a) return;

			if (callback(new URL(a.href))) {
				event.preventDefault();
				history.pushState({}, '', a.href);
			}
		});

		window.addEventListener('popstate', event => {
			callback(window.location);
		});

		callback(window.location);
	}
};

window.router = router;

export default router;