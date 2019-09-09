<script context="module">
	export function preload({ query }) {
		return this.fetch(`credentials/${query.type}.json`, {
			credentials: query.creds
		}).then(r => r.json());
	}
</script>

<script>
	export let message;
</script>

<h1>{message}</h1>