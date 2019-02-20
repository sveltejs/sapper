<script>
	import { getContext } from 'svelte';
	const { rootPreloadFunctionRan } = getContext('x');
</script>

<h1>root preload function ran: {rootPreloadFunctionRan}</h1>