<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
</script>

<div class:error-layout="{!!$page.error}">
  <slot></slot>
</div>
