<script context="module">
	export function preload() {
		return {
			rootPreloadFunctionRan: true
		};
	}
</script>

<script>
	import { stores } from '@sapper/app';
	import { setContext } from 'svelte';

	export let rootPreloadFunctionRan;

	const { preloading } = stores();

	setContext('x', { rootPreloadFunctionRan });
</script>

{#if $preloading}
	<progress class='preloading-progress' value=0.5/>
{/if}

<slot></slot>