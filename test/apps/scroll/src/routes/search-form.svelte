<script>
	import { goto } from '@sapper/app';

	function preserveScroll() {
		goto('/a-third-tall-page', { noscroll: true });
	}

	function scroll() {
		goto('/a-third-tall-page');
	}
</script>

<h1>A search form</h1>

<div style="height: 9999px" />

<div id="search">
	<button id="scroll" on:click={scroll}>Don't preserve scroll</button>
	<button id="preserve" on:click={preserveScroll}>Preserve scroll</button>
</div>
