<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
</script>

<div class:error-layout="{!!$page.error}" class="status-{$page.status}">
  <slot></slot>
</div>
