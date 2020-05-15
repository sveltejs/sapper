---
title: Deployment
---

Sapper apps run anywhere that supports Node 8 or higher.

### Deploying to Vercel ([formerly ZEIT Now](https://vercel.com/blog/zeit-is-now-vercel))

#### Using Now v2

We can use an unoffical third-party libary like [now-sapper loader](https://www.npmjs.com/package/now-sapper) to deploy our projects to [Vercel] and even use our sapper runtime environment there.

Visit the corresponding github repository of [now-sapper loader](https://github.com/thgh/now-sapper#readme) for implementation details and bug reports regarding [Vercel] deployments.

> Note about Now v1
>
> Now v1 is deprecated and using it should be avoided, see [this comment](https://github.com/zeit/now/issues/1805#issuecomment-452470953).  
> If you are still running v1 consider upgrating to the newest version.

### Deploying service workers

Sapper makes the Service Worker file (`service-worker.js`) unique by including a timestamp in the source code
(calculated using `Date.now()`).

In environments where the app is deployed to multiple servers (such as [Vercel]), it is advisable to use a
consistent timestamp for all deployments. Otherwise, users may run into issues where the Service Worker
updates unexpectedly because the app hits server 1, then server 2, and they have slightly different timestamps.

To override Sapper's timestamp, you can use an environment variable (e.g. `SAPPER_TIMESTAMP`) and then modify
the `service-worker.js`:

```js
const timestamp = process.env.SAPPER_TIMESTAMP; // instead of `import { timestamp }`

const ASSETS = `cache${timestamp}`;

export default {
	/* ... */
	plugins: [
		/* ... */
		replace({
			/* ... */
			'process.env.SAPPER_TIMESTAMP': process.env.SAPPER_TIMESTAMP || Date.now()
		})
	]
}
```

Then you can set it using the environment variable, e.g.:

```bash
SAPPER_TIMESTAMP=$(date +%s%3N) npm run build
```

When deploying to [Vercel], you can pass the environment variable into Now itself:

```bash
now -e SAPPER_TIMESTAMP=$(date +%s%3N)
```

[Vercel]: https://vercel.com/home
