---
title: Security
---

By default, Sapper does not add security headers to your app, but you may add them yourself using middleware such as [Helmet][].

### Content Security Policy (CSP)

Sapper generates inline `<script>`s, which can fail to execute if [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) headers disallow arbitrary script execution (`unsafe-inline`).

To work around this, Sapper can inject a [nonce](https://www.troyhunt.com/locking-down-your-website-scripts-with-csp-hashes-nonces-and-report-uri/) which can be configured with middleware to emit the proper CSP headers. Here is an example using [Express][] and [Helmet][]:

```js
// server.js
import uuidv4 from 'uuid/v4';
import helmet from 'helmet';

app.use((req, res, next) => {
	res.locals.nonce = uuidv4();
	next();
});
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			scriptSrc: [
				"'self'",
				(req, res) => `'nonce-${res.locals.nonce}'`
			]
		}
	}
}));
app.use(sapper.middleware());
```

Using `res.locals.nonce` in this way follows the convention set by
[Helmet's CSP docs](https://helmetjs.github.io/docs/csp/#generating-nonces).

[Express]: https://expressjs.com/
[Helmet]: https://helmetjs.github.io/