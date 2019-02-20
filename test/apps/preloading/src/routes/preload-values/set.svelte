<script context="module">
	export function preload() {
		return {
			set: new Set(['x'])
		};
	}
</script>

<script>
	export let set;
</script>

<h1>{set.has('x')}</h1>