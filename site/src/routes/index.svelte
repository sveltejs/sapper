<script>
	import { Hero, Blurb } from '@sveltejs/site-kit';
</script>

<svelte:head>
	<title>Sapper • The predecessor of SvelteKit</title>
</svelte:head>

<Hero
	title="Sapper"
	tagline="The predecessor of SvelteKit"
	outline="sapper-logo-outline.svg"
	logotype="sapper-logotype.svg"
/>

<section>
	<div class="box">
		<h2>SvelteKit is now available</h2>
		<p><a href="https://kit.svelte.dev/">SvelteKit</a> is the successor to Sapper. <a href="https://kit.svelte.dev/">Learn more</a>.</p>
	</div>
</section>

<style>
	.box {
		background: var(--prime);
		grid-area: one / one / one / one;
		padding: 1em;
		display: flex;
		flex-direction: column;
		border-bottom: none;
		border-radius: var(--border-r);
		color: white;
	}

	.box a {
		color: white;
	}

	.box h2 {
		padding: 0;
		margin: 0 0 0.5em 0;
		font-size: var(--h2);
		color: white;
		text-align: left;
	}
	
	.box p {
		margin-bottom: 0;
	}

	section {
		position: relative;
		margin: 10rem auto;
		padding: 0 var(--side-nav);
		max-width: 120rem;
	}
</style>
