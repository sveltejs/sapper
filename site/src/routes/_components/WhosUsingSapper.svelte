<!--
	Instructions for adding new logos:

	* Fork this repo, and clone your fork
	* Create a branch called e.g. `add-myorganisation-logo`
	* Add the logo to the `organisations` directory (preferably SVG)
	* Add a new <a> tag in this component, in alphabetical order
	* Create a pull request. Thanks!
-->

<style>
	.logos {
		margin: 1em 0 0 0;
		display: flex;
		flex-wrap: wrap;
	}

	a {
		height: 40px;
		margin: 0 0.5em 0.5em 0;
		display: flex;
		align-items: center;
		border: 2px solid var(--second);
		padding: 5px 10px;
		border-radius: 20px;
		color: var(--text);
	}

	.add-yourself {
		color: var(--prime);
	}

	picture,
	img {
		height: 100%;
	}

	@media (min-width: 540px) {
		a {
			height: 60px;
			padding: 10px 20px;
			border-radius: 30px;
		}
	}
</style>

<div class="logos">
<a target="_blank" rel="noopener" href="https://github.com/sveltejs/community/blob/master/whos-using-sapper/WhosUsingSapper.svelte" class="add-yourself"><span>+ your company?</span></a>
</div>
