---
title: Server-side rendering
---

Sapper, by default, renders server-side first (SSR), and then re-mounts any dynamic elements on the client. Svelte provides [excellent support for this](https://svelte.dev/docs#Server-side_component_API). This has benefits in performance and search engine indexing, among others, but comes with its own set of complexities.

### Making a component SSR compatible

Sapper works well with most third-party libraries you are likely to come across. However, sometimes a third-party library depends on browser objects like `window` or `document`.

Since there are no browser objects in a server-side environment like Sapper's, importing a module dependant on them can cause the import to fail and terminate the Sapper's server with an error such as:

```bash
ReferenceError: window is not defined
```

The way to get around this is to dynamically import the library from within the `onMount` function (which is only called on the client) so that the import is never called on the server.

For example, importing and mounting [Quill.js](https://github.com/quilljs/quill/)

```html
<script>
	import {onMount} from 'svelte'
        let editor
	
	onMount(async() => {
		const { default: Quill } = await import('quill')
		new Quill(editor)
	})
</script>

<div bind:this={editor}></div>

```
