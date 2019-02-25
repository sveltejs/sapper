<script context="module">
	export function preload() {
		return {
			bar: 'bar'
		};
	}
</script>

<script>
	export let bar;
</script>

<h1>{bar}</h1>
