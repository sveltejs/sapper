<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
</script>

<script context="module">
	export function preload({ params, query }) {
		if (query['layoutthrows']) {
			this.error(500, 'layout preload threw');
		}
	}
</script>

<div class:error-layout="{!!$page.error}">
	<slot></slot>
</div>
