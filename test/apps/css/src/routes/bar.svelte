<script>
	import { onMount } from 'svelte';

	export let Title;

	onMount(() => {
		import('./_components/Title.svelte').then(mod => {
			Title = mod.default;
		});
	});
</script>

<svelte:component this={Title}/>