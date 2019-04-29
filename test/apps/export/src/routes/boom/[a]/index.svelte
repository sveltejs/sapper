<script context="module">
	export function preload({ params }) {
		return params;
	}
</script>

<script>
	export let a;

	const list = Array(20).fill().map((_, i) => i + 1);
</script>

{#each list as b}
	<a href="boom/{a}/{b}">{a}/{b}</a>
{/each}