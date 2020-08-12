<script context="module">
	export function preload(page, { title }) {
		return { title };
	}
</script>

<script>
	import { stores } from '@sapper/app';
	const { session } = stores();

	export let title;
</script>

<h1>{title}</h1>

<button on:click="{() => session.set({ title: 'changed' })}">
	click me
</button>