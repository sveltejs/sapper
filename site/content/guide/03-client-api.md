---
title: Client API
---

The `__sapper__/client.js` module contains functions for controlling your app and responding to events.


### start({ target, store? })

* `target` — an element to render pages to
* `store` — an function that, given some data, returns a Store object. See the [state management](https://sapper.svelte.technology/guide#state-management) section for more detail

This configures the router and starts the application — listens for clicks on `<a>` elements, interacts with the `history` API, and renders and updates your Svelte components.

Returns a `Promise` that resolves when the initial page has been hydrated.

```js
import * as sapper from '../__sapper__/client.js';

sapper.start({
	target: document.querySelector('#sapper')
}).then(() => {
	console.log('client-side app has started');
});
```


### goto(href, options?)

* `href` — the page to go to
* `options` — can include a `replaceState` property, which determines whether to use `history.pushState` (the default) or `history.replaceState`). Not required

Programmatically navigates to the given `href`. If the destination is a Sapper route, Sapper will handle the navigation, otherwise the page will be reloaded with the new `href`. (In other words, the behaviour is as though the user clicked on a link with this `href`.)


### prefetch(href)

* `href` — the page to prefetch

Programmatically prefetches the given page, which means a) ensuring that the code for the page is loaded, and b) calling the page's `preload` method with the appropriate options. This is the same behaviour that Sapper triggers when the user taps or mouses over an `<a>` element with [rel=prefetch](guide#prefetching).



### prefetchRoutes(routes?)

* `routes` — an optional array of strings representing routes to prefetch

Programmatically prefetches the code for routes that haven't yet been fetched. Typically, you might call this after `sapper.start()` is complete, to speed up subsequent navigation (this is the 'L' of the [PRPL pattern](https://developers.google.com/web/fundamentals/performance/prpl-pattern/)). Omitting arguments will cause all routes to be fetched, or you can specify routes by any matching pathname such as `/about` (to match `src/routes/about.html`) or `/blog/*` (to match `src/routes/blog/[slug].html`). Unlike `prefetch`, this won't call `preload` for individual pages.
