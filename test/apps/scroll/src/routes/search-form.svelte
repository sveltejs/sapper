<script>
	import { goto } from "@sapper/app";

	function handleSearch() {
		goto("?q=foo");
	}
</script>

<h1>A search form</h1>

<div style="height: 9999px"></div>

<div id="search">
	<button on:click={handleSearch()}>Search</button>
</div>