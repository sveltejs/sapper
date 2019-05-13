<script context="module">
	import counts from '../_counts.js';

	export function preload() {
		return {
			count: counts.z += 1
		};
	}
</script>

<script>
	import { stores } from '@sapper/app';
	const { page } = stores();

	export let count;
</script>

<span>z: {$page.params.z} {count}</span>
<a href="foo/bar/qux">goto foo/bar/qux</a>
<a href="foo/abc/def">goto foo/abc/def</a>