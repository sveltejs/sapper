<script context="module">
	import counts from '../_counts.js';

	export function preload() {
		return {
			count: counts.y += 1
		};
	}
</script>

<script>
	import { page } from '@sapper/app';

	export let count;
	export let segment;
</script>

<span>y: {$page.params.y} {count}</span>
<slot></slot>

<span>child segment: {segment}</span>