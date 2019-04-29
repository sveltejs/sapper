---
title: State management
---

Sapper integrates with the built-in Svelte store. If you're not familiar with Store, read the [Svelte state management](https://svelte.technology/guide#state-management) guide before continuing with this section.

To use Store, you must integrate it with your server and client apps separately.

### On the server

Whereas the client-side app has a single Store instance that lasts as long as the page is open, the server-side app must create a new store for each request:

```js
// app/server.js
import { Store } from 'svelte/store.js';

express() // or Polka, or a similar framework
	.use(
		compression({ threshold: 0 }),
		serve('assets'),
		authenticationMiddleware(),
		sapper.middleware({
			store: request => {
				return new Store({
					user: request.user
				});
			}
		})
	)
	.listen(process.env.PORT);
```

In this example, we're using some imaginary `authenticationMiddleware` that creates a `request.user` object based on the user's cookies. (In real life it tends to be a bit more involved — see [express-session](https://github.com/expressjs/session) and [Passport](http://www.passportjs.org/) if you're ready to learn more about sessions and authentication.)

Because we've supplied a `store` option, Sapper creates a new `Store` instance for each new `request`. The data in our store will be used to render the HTML that Sapper responds with.


### On the client

This time around, we're creating a single store that is attached to each page as the user navigates around the app.

```js
import * as sapper from '../__sapper__/client.js';
import { Store } from 'svelte/store.js';

sapper.start({
	target: document.querySelector('#sapper'),
	store: data => {
		// `data` is whatever was in the server-side store
		return new Store(data);
	}
});
```

> In order to re-use the server-side store data, it must be serializable (using [devalue](https://github.com/Rich-Harris/devalue)) — no functions or custom classes, just built-in JavaScript data types
