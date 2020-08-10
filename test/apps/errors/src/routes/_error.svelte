<script>
	import { onMount, onDestroy } from 'svelte';

	export let status, error = {};

	let mounted = false;

	onMount(() => {
		mounted = 'success';
	})
</script>

<h1>{status}</h1>

<h2>{mounted}</h2>

<p>{error.message}</p>

<span>{error.stack}</span>
