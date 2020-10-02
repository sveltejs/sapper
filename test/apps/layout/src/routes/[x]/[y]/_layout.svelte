<script context="module">
	import counts from '../_counts.js';

	export function preload() {
		return {
			count: counts.y += 1
		};
	}
</script>

<script>
	import { stores } from '@sapper/app';
	const { page } = stores();

	export let count;
	$: segment = $page.path.split('/')[3];
</script>

<span>y: {$page.params.y} {count}</span>
<slot></slot>

<span>child segment: {segment}</span>