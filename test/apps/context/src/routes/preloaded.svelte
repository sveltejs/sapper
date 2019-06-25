<script context="module">
	import { getContext } from 'svelte';
	export function preload(page, session, context) {
		try {
			return { title: getContext('title'), title2: context.get('title') };
		} catch (e ) {
			console.error(e);
			throw e;
		}
	};
</script>

<script>

	export let title;
	export let title2;
</script>

<h1>{title}</h1>
<h2>{title2}</h2>