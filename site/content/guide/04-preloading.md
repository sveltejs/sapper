---
title: Preloading
---

As seen in the [routing](guide#routing) section, top-level page components can have a `preload` function that will load some data that the page depends on. This is similar to `getInitialProps` in Next.js or `asyncData` in Nuxt.js.

```html
<script>
	export default {
		preload({ params, query }) {
			const { slug } = params;

			return this.fetch(`blog/${slug}.json`).then(r => r.json()).then(article => {
				return { article };
			});
		}
	};
</script>
```

Your `preload` function is optional; whether or not you include it, the component will have access to the `query` and `params` objects, on top of any [default data](https://svelte.technology/guide#default-data) specified with a `data` property.

The top-level `_layout.html` component is rendered with a `preloading` value: `true` during preloading, `false` otherwise. This value is useful to display a loading spinner or otherwise indicate that a navigation is in progress.

```html
<!-- src/routes/_layout.html -->
{#if preloading}
  <div>Loading...</div>
{/if}

<svelte:component this={child.component} {...child.props}/>
```

The `preloading` value is only set during page navigations. Prefetching (see [below](guide#prefetching)) does not set `preloading` since it is intended to be transparent to the user.

### Argument

The `preload` function receives a `{ params, query }` object where `params` is derived from the URL and the route filename, and `query` is an object of values in the query string.

So if the example above was `src/routes/blog/[slug].html` and the URL was `/blog/some-post?foo=bar&baz`, the following would be true:

* `params.slug === 'some-post'`
* `query.foo === 'bar'`
* `query.baz === true`


### Return value

If you return a Promise from `preload`, the page will delay rendering until the promise resolves. You can also return a plain object.

When Sapper renders a page on the server, it will attempt to serialize the resolved value (using [devalue](https://github.com/Rich-Harris/devalue)) and include it on the page, so that the client doesn't also need to call `preload` upon initialization. Serialization will fail if the value includes functions or custom classes (cyclical and repeated references are fine, as are built-ins like `Date`, `Map`, `Set` and `RegExp`).

### Context

Inside `preload`, you have access to three methods...

* `this.fetch(url, options)`
* `this.error(statusCode, error)`
* `this.redirect(statusCode, location)`

...and `this.store`, if you're using [state management](guide#state-management).


#### this.fetch

In browsers, you can use `fetch` to make AJAX requests, for getting data from your server routes (among other things). On the server it's a little trickier — you can make HTTP requests, but you must specify an origin, and you don't have access to cookies. This means that it's impossible to request data based on the user's session, such as data that requires you to be logged in.

To fix this, Sapper provides `this.fetch`, which works on the server as well as in the client:

```html
<script>
	export default {
		preload() {
			return this.fetch(`secret-data.json`, {
				credentials: 'include'
			}).then(r => {
				// ...
			});
		}
	};
</script>
```

Note that you will need to use session middleware such as [express-session](https://github.com/expressjs/session) in your `app/server.js` in order to maintain user sessions or do anything involving authentication.


#### this.error

If the user navigated to `/blog/some-invalid-slug`, we would want to render a 404 Not Found page. We can do that with `this.error`:

```html
<script>
	export default {
		preload({ params, query }) {
			const { slug } = params;

			return this.fetch(`blog/${slug}.json`).then(r => {
				// assume all responses are either 200 or 404
				if (r.status === 200) {
					return r.json().then(article => {
						return { article };
					});
				} else {
					this.error(404, 'Not found');
				}
			});
		}
	};
</script>
```

The same applies to other error codes you might encounter.


#### this.redirect

You can abort rendering and redirect to a different location with `this.redirect`:

```html
<script>
	export default {
		preload({ params, session }) {
			const { user } = this.store.get();

			if (!user) {
				return this.redirect(302, 'login');
			}

			return {
				user
			};
		}
	};
</script>
```
