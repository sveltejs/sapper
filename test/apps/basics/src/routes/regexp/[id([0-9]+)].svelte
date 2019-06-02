<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
</script>

<h1>Nested regexp page {$page.params.id}</h1>
