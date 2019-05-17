<script context="module">
	export function preload({ params }) {
		if (params.x === 'a') {
			return new Promise(resolve => setTimeout(resolve, 100));
		}

		return params;
	}
</script>

<script>
	export let x;
</script>

<a href="b-{x}">b-{x}</a>
