<script>
	import { onMount } from 'svelte';

	export let barLink = false;

	onMount(() => {
		barLink = true
	});
</script>

<h1>A tall page</h1>

<a href="tall-page#foo">scroll to foo</a>
<div style="height: 9999px"></div>

<div id="foo">
	<a href="another-tall-page">link</a>
	<a href="another-tall-page" sapper:noscroll>link</a>
	{#if barLink}
		<a href="another-tall-page#bar">link</a>
	{/if}
</div>