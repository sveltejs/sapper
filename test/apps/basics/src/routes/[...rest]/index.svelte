<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
</script>

<h1>{$page.params.rest.join(',')}</h1>

<a href="xyz/abc/deep">deep</a>
