<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
</script>

<h1>Regexp page {$page.params.id}</h1>

<a href="regexp/234">nested regexp route</a>
