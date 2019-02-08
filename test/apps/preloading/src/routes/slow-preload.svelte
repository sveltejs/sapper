<script context="module">
	export function preload() {
		return new Promise(fulfil => {
			if (typeof window !== 'undefined') {
				window.fulfil = fulfil;
			} else {
				fulfil({});
			}
		});
	}
</script>

<h1>This page should never render</h1>