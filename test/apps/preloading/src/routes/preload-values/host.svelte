<script context="module">
	export function preload(page) {
		return {
			host: page.host
		};
	}
</script>

<script>
	export let host;
</script>

<h1>{host.replace(/:\d+$/, '')}</h1>