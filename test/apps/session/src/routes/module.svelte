<script context="module">
	import { session } from '@sapper/app';
</script>

<h1>{$session.title}</h1>

<button on:click="{() => session.set({ title: 'clicked' })}">
	click me
</button>

<a href="/preloaded">preloaded</a>
