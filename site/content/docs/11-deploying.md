---
title: Deployment
---

Sapper apps run anywhere that supports Node 8 or higher.


### Deploying to Now

We can very easily deploy our apps to [Now][]:

```bash
npm install -g now
now
```

This will upload the source code to Now, whereupon it will do `npm run build` and `npm start` and give you a URL for the deployed app.

For other hosting environments, you may need to do `npm run build` yourself.

### Deploying service workers

Sapper makes the Service Worker file (`service-worker.js`) unique by including a timestamp in the source code 
(calculated using `Date.now()`).
 
In environments where the app is deployed to multiple servers (such as [Now][]), it is advisable to use a 
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

When deploying to [Now][], you can pass the environment variable into Now itself:

```bash
now -e SAPPER_TIMESTAMP=$(date +%s%3N)
```

[Now]: https://zeit.co/now