---
title: Server-side rendering
---

Sapper, by default, renders server-side first (SSR), and then re-mounts any dynamic elements on the client. Svelte provides [excellent support for this](https://svelte.dev/docs#Server-side_component_API). This has benefits in performance and search engine indexing, among others, but comes with its own set of complexities.

### Skipping SSR for a component

Sapper works well with most third-party libraries you are likely to come across. However, sometimes you may wish to use a library only on the client-side or a third-party library comes bundled in a way which is not compatible with Sapper.

Incompatibility with Sapper will occur when a library has dependency on `window`. One of the more common causes of this can occur when a library is bundled to work with multiple different module loaders in a way that checks for the existence of `window.global`. Since there is no `window` in a server-side environment like Sapper's, the action of simply importing such a module can cause the import to fail, and terminate the Sapper's server with an error such as:

```bash
ReferenceError: window is not defined
```

The way to get around this is to use a dynamic import for your component, from within the `onMount` function (which is only called on the client), so that your import code is never called on the server.

```html
<script>
	import { onMount } from 'svelte';

	let MyComponent;

	onMount(async () => {
		const module = await import('my-client-side-component');
		MyComponent = module.default;
	});
</script>

<svelte:component this={MyComponent} foo="bar"/>
```
