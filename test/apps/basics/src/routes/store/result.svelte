<script>
	import { stores } from '@sapper/app';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	const { session } = stores();
	let call_count = 0;

	onMount(() => {
		call_count = get(session);
	});
</script>

<h1>Result</h1>
<h2>Called {call_count} time</h2>