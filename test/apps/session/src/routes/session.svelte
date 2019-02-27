<script>
	import { session } from '@sapper/app';
</script>

<h1>{$session.title}</h1>

<button on:click="{() => session.set({ title: 'changed' })}">
	click me
</button>