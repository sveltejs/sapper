<script>
	export let status;
	export let error;
</script>

<style>
	h1 {
		color: purple;
	}
</style>

<h1>This is an error page</h1>

<h2>{status}</h2>

<p>{error.message}</p>

<pre>{error.stack}</pre>
