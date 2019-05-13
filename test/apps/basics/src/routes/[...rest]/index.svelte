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

<a href="xyz/abc/deep">deep</a>
<a href="xyz/abc">deep</a>
<a href="xyz/abc/def">deep</a>
<a href="xyz/abc/def/ghi">deep</a>
