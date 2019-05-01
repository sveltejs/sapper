<script>
	import { stores } from '@sapper/app';
	const { session } = stores();
</script>

<h1>{$session.title}</h1>

<button on:click="{() => session.set({ title: 'changed' })}">
	click me
</button>