<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
</script>

<h1>{$page.params.slug.toUpperCase()}</h1>