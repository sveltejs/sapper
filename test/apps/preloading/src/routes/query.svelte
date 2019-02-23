<script context="module">
	export function preload({query}) {
		return { text: query.text };
	}
</script>

<script>
export let text
</script>

<h1>{text}</h1>

<a href="query?text=Second">Second</a>