<script>
	export let error;
	export let status;
</script>

<h1>{status}</h1>

<p>{error.message}</p>

{#if process.env.NODE_ENV === 'development'}
	<pre>{error.stack}</pre>
{/if}