---
title: Base URLs
---

Ordinarily, the root of your Sapper app is served at `/`. But in some cases, your app may need to be served from a different base path — for example, if Sapper only controls part of your domain, or if you have multiple Sapper apps living side-by-side.

This can be done like so:

```js
// app/server.js

express() // or Polka, or a similar framework
	.use(
		'/my-base-path', // <!-- add this line
		compression({ threshold: 0 }),
		serve('static'),
		sapper.middleware()
	)
	.listen(process.env.PORT);
```

Sapper will detect the base path and configure both the server-side and client-side routers accordingly.

If you're [exporting](docs#Exporting) your app, you will need to tell the exporter where to begin crawling:

```bash
sapper export --basepath my-base-path
```

### `originAliases`

You can specify [URL origin](https://nodejs.org/api/url.html#url_url_strings_and_url_objects) aliases to use when fetching data with `sapper.middleware({ originAliases: Map<String,String> })`. By default, Sapper uses the origin `http://127.0.0.1/` for fetching data from relative URLs, so you would specify that as the map key to override the default origin.

If your API is running on another server (perhaps because you've written it in another language), you can utilize this option to fetch data from that server. You may use this option to specify a private hostname or internal alias for that service. E.g. some server orchestration tools such as Kubernetes will modify `resolv.conf` to provide internal hostnames for your services.
