<script>
	let test = undefined;
</script>

<input bind:value={test} type=text>

<span>{test || '-'}</span>