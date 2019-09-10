---
title: Server-side rendering
---

Sapper, by default, renders server-side first (SSR), and then re-mounts any dynamic elements on the client. Svelte provides [excellent support for this](https://svelte.dev/docs#Server-side_component_API). This has benefits in performance and search engine indexing, among others, but comes with its own set of complexities.

### Making a component SSR compatible

Sapper works well with most third-party libraries you are likely to come across. However, sometimes, a third-party library comes bundled in a way which allows it to work with multiple different module loaders. Sometimes, this code creates a dependency on `window`, such as checking for the existence of `window.global` might do.

Since there is no `window` in a server-side environment like Sapper's, the action of simply importing such a module can cause the import to fail, and terminate the Sapper's server with an error such as:

```bash
ReferenceError: window is not defined
```

The way to get around this is to use a dynamic import for your component, from within the `onMount` function (which is only called on the client), so that your import code is never called on the server.

```html
<script>
	import { onMount } from 'svelte';

	let MyComponent;

	onMount(async () => {
		const module = await import('my-non-ssr-component');
		MyComponent = module.default;
	});
</script>

<svelte:component this={MyComponent} foo="bar"/>
```
