<script context="module">
	export function preload(page) {
		return {
			query: page.query
		};
	}
</script>

<script>
	export let query;
</script>

<pre>{JSON.stringify(query)}</pre>

<a href="echo?foo=1">foo=1</a>
<a href="echo?foo=2">foo=2</a>
<a href="echo?foo=3">foo=3</a>