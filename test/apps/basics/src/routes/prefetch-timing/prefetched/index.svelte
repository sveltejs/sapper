<script context="module">
		export function preload() {
				if (typeof window !== 'undefined' && window.onPrefetched) {
						Promise.resolve().then(() => window.onPrefetched());
				}
		}
</script>

<script>
		import { onMount } from 'svelte';
		let prefetchlink;

		onMount(() => {
				let timeout;

				/**
				 * This emulates the logic in start prefetching. Just firing after the first mouse move
				 * would also work fine in the Puppeteer tests, just not if you try it manually.
				 */
				prefetchlink.addEventListener('mousemove', () => {
						clearTimeout(timeout);

						if (window.onPrefetched) {
								timeout = setTimeout(() => {
										window.onPrefetched();
								}, 50);
						}
				});
		});
</script>

<h1>Prefetched</h1>

<a href="/prefetch-timing/prefetcher">prefetcher</a>
<a href="/prefetch-timing/prefetched" rel="prefetch" bind:this={prefetchlink}>prefetched</a>
