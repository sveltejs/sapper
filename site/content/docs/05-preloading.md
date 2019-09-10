---
title: Preloading
---

As seen in the [routing](docs#Routing) section, page components can have an optional `preload` function that will load some data that the page depends on. This is similar to `getInitialProps` in Next.js or `asyncData` in Nuxt.js.

```html
<script context="module">
	export async function preload(page, session) {
		const { slug } = page.params;

		const res = await this.fetch(`blog/${slug}.json`);
		const article = await res.json();

		return { article };
	}
</script>
```

It lives in a `context="module"` script — see the [tutorial](https://svelte.dev/tutorial/module-exports) — because it's not part of the component instance itself; instead, it runs *before* the component is created, allowing you to avoid flashes while data is fetched.

### Argument

The `preload` function receives two arguments — `page` and `session`.

`page` is a `{ host, path, params, query }` object where `host` is the URL's host, `path` is its pathname, `params` is derived from `path` and the route filename, and `query` is an object of values in the query string.

So if the example above was `src/routes/blog/[slug].svelte` and the URL was `/blog/some-post?foo=bar&baz`, the following would be true:

* `page.path === '/blog/some-post'`
* `page.params.slug === 'some-post'`
* `page.query.foo === 'bar'`
* `page.query.baz === true`

`session` is generated on the server by the `session` option passed to `sapper.middleware` (TODO this needs further documentation. Perhaps a server API section?)


### Return value

If you return a Promise from `preload`, the page will delay rendering until the promise resolves. You can also return a plain object.

When Sapper renders a page on the server, it will attempt to serialize the resolved value (using [devalue](https://github.com/Rich-Harris/devalue)) and include it on the page, so that the client doesn't also need to call `preload` upon initialization. Serialization will fail if the value includes functions or custom classes (cyclical and repeated references are fine, as are built-ins like `Date`, `Map`, `Set` and `RegExp`).

### Context

Inside `preload`, you have access to three methods:

* `this.fetch(url, options)`
* `this.error(statusCode, error)`
* `this.redirect(statusCode, location)`


#### this.fetch

In browsers, you can use `fetch` to make AJAX requests, for getting data from your server routes (among other things). On the server it's a little trickier — you can make HTTP requests, but you must specify an origin, and you don't have access to cookies. This means that it's impossible to request data based on the user's session, such as data that requires you to be logged in.

To fix this, Sapper provides `this.fetch`, which works on the server as well as in the client:

```html
<script context="module">
	export async function preload() {
		const res = await this.fetch(`secret-data.json`, {
			credentials: 'include'
		});

		// ...
	}
</script>
```

Note that you will need to use session middleware such as [express-session](https://github.com/expressjs/session) in your `app/server.js` in order to maintain user sessions or do anything involving authentication.


#### this.error

If the user navigated to `/blog/some-invalid-slug`, we would want to render a 404 Not Found page. We can do that with `this.error`:

```html
<script context="module">
	export async function preload({ params, query }) {
		const { slug } = params;

		const res = await this.fetch(`blog/${slug}.json`);

		if (res.status === 200) {
			const article = await res.json();
			return { article };
		}

		this.error(404, 'Not found');
	}
</script>
```

The same applies to other error codes you might encounter.


#### this.redirect

You can abort rendering and redirect to a different location with `this.redirect`:

```html
<script context="module">
	export async function preload(page, session) {
		const { user } = session;

		if (!user) {
			return this.redirect(302, 'login');
		}

		return { user };
	}
</script>
```
