<script>
	import { getSession } from '@sapper/app';
	const session = getSession();
</script>

<h1>{$session.title}</h1>

<button on:click="{() => session.set({ title: 'changed' })}">
	click me
</button>