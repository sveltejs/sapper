<script context="module">
	export function preload({ query, params }) {
		const { rest } = params;
		return { rest };
	}
</script>

<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
	export let rest;
</script>

<h1>{$page.params.rest.join(',')}</h1>
<h2>{rest.join(',')}</h2>
<p>{rest.length}</p>

<a href="abc--def">nothing</a>
<a href="abc-def-def">something</a>
<a href="abc-def/ghi-def">many things</a>
