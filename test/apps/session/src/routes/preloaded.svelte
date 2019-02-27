<script context="module">
	export function preload(page, { title }) {
		return { title };
	};
</script>

<script>
	import { session } from '@sapper/app';

	export let title;
</script>

<h1>{title}</h1>

<button on:click="{() => session.set({ title: 'changed' })}">
	click me
</button>