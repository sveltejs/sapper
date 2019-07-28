<script>
	const list = Array(20).fill().map((_, i) => i + 1);
</script>

{#each list as a}
	<a href="boom/{a}">{a}</a>
{/each}