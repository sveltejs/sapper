<script>
	import { stores } from '@sapper/app';
	const { page } = stores();
</script>

{#if $page.error}
  <div class="error-layout">
    <slot></slot>
  </div>
{:else}
  <slot></slot>
{/if}
