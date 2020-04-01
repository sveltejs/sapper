# sapper changelog

## 0.27.12

* Fix missing MIME types when serving files from `/client/` ([#1136](https://github.com/sveltejs/sapper/issues/1136))


## 0.27.11

* Fix vulnerability when serving `/client/...` files — **Please upgrade!**
* Revert CSS handling change from 0.27.10


## 0.27.10

* Fix component styles being duplicated between `client.css` and `main.css` ([#1076](https://github.com/sveltejs/sapper/issues/1076))


## 0.27.9

* Recheck whether a component has a `preload` whenever the file changes ([#611](https://github.com/sveltejs/sapper/issues/611))


## 0.27.8

* Enable sourcemaps in dev mode only by default ([#590](https://github.com/sveltejs/sapper/issues/590))
* Don't silently ignore unknown options passed to CLI (again) ([#729](https://github.com/sveltejs/sapper/issues/729))


## 0.27.7

* Revert erroring on unknown options passed to CLI, pending upstream bug investigation


## 0.27.6

* Various fixes for CSS sourcemaps ([#421](https://github.com/sveltejs/sapper/issues/421), [#537](https://github.com/sveltejs/sapper/issues/537), [#808](https://github.com/sveltejs/sapper/issues/808))
* Add `export` option `--entry` for specifying multiple entry points ([#749](https://github.com/sveltejs/sapper/issues/749))
* Fix paths to component CSS in legacy build ([#775](https://github.com/sveltejs/sapper/issues/775))


## 0.27.5

* Fix exported sites with links to static files ([#572](https://github.com/sveltejs/sapper/issues/572))
* Properly update manifest data during changes in dev mode ([#713](https://github.com/sveltejs/sapper/pull/713))
* Don't silently ignore unknown options passed to CLI ([#729](https://github.com/sveltejs/sapper/issues/729))
* Add `host` value to `page` store, giving uniform access to `req.headers.host`/`location.host` ([#735](https://github.com/sveltejs/sapper/issues/735))
* Log uncaught exceptions in server routes ([#782](https://github.com/sveltejs/sapper/issues/782))
* Fix default error template ([#817](https://github.com/sveltejs/sapper/issues/817))


## 0.27.4

* Update devalue


## 0.27.3

* Accommodate Svelte 3.5.0


## 0.27.2

* Fix routes with regular expressions ([#707](https://github.com/sveltejs/sapper/issues/707))
* Fix `sapper build --output` option ([#723](https://github.com/sveltejs/sapper/pull/723))


## 0.27.1

* Prevent infinite loop if `preload` errors ([#677](https://github.com/sveltejs/sapper/pull/677))
* Allow disabling of live reload ([#683](https://github.com/sveltejs/sapper/pull/683))
* Let browser handle initial scroll ([#331](https://github.com/sveltejs/sapper/issues/331))
* Allow custom route file extensions via `--ext` ([#632](https://github.com/sveltejs/sapper/pull/632))
* Wait for server to restart before attaching debugger ([#694](https://github.com/sveltejs/sapper/pull/694))
* Fix export queue ([#698](https://github.com/sveltejs/sapper/pull/698))
* Rerun `preload` functions when query changes ([#701](https://github.com/sveltejs/sapper/issues/701))
* Navigate when spread route changes ([#688](https://github.com/sveltejs/sapper/issues/688))


## 0.27.0

* Change license from LIL to MIT ([#652](https://github.com/sveltejs/sapper/pull/652))
* Fix index server route mapping ([#624](https://github.com/sveltejs/sapper/issues/624))

## 0.26.1

* Handle skipped segments ([#663](https://github.com/sveltejs/sapper/pull/663))

## 0.26.0

* Update to Svelte 3
* Slot-based nested routes ([#573](https://github.com/sveltejs/sapper/issues/573))
* Make `page`, `preloading` and `session` stores available to components ([#642](https://github.com/sveltejs/sapper/pull/642))
* Handle missing/empty refs when exporting ([#602](https://github.com/sveltejs/sapper/issues/602))
* Prevent race condition when exporting ([#585](https://github.com/sveltejs/sapper/pull/585))
* Fix redirects with base path ([#589](https://github.com/sveltejs/sapper/issues/589))
* Add `<link rel="preload">` to exported HTML ([#568](https://github.com/sveltejs/sapper/pull/568))
* Handle deep links that are invalid selectors on initial load ([#516](https://github.com/sveltejs/sapper/issues/516))
* Use shared queue for exporting ([#604](https://github.com/sveltejs/sapper/issues/604))
* Handle `+` character in query string ([#618](https://github.com/sveltejs/sapper/issues/618))
* Spread routes ([#545](https://github.com/sveltejs/sapper/issues/545))
* Fix navigation from `/a/[id]` to `/b/[id]` ([#610](https://github.com/sveltejs/sapper/pull/610))
* Allow `preload` functions to return falsy values ([#587](https://github.com/sveltejs/sapper/issues/587))
* Mount error pages correctly ([#620](https://github.com/sveltejs/sapper/pull/620))

## 0.25.0

* Force refresh on `goto(current_url)` ([#484](https://github.com/sveltejs/sapper/pull/484))
* Fix preloading navigation bug ([#532](https://github.com/sveltejs/sapper/issues/532))
* Don't mutate opts.headers ([#528](https://github.com/sveltejs/sapper/issues/528))
* Don't crawl hundreds of pages simultaneously ([#369](https://github.com/sveltejs/sapper/pull/369))

## 0.24.3

* Add service-worker-index.html shell file for offline support ([#422](https://github.com/sveltejs/sapper/issues/422))
* Don't cache .map files ([#534](https://github.com/sveltejs/sapper/issues/534))

## 0.24.2

* Support Rollup 1.0 ([#541](https://github.com/sveltejs/sapper/pull/541))

## 0.24.1

* Include CSS chunks in webpack build info to avoid duplication ([#529](https://github.com/sveltejs/sapper/pull/529))
* Fix preload `as` for styles ([#530](https://github.com/sveltejs/sapper/pull/530))

## 0.24.0

* Handle external URLs in `this.redirect` ([#490](https://github.com/sveltejs/sapper/issues/490))
* Strip leading `/` from basepath ([#495](https://github.com/sveltejs/sapper/issues/495))
* Treat duplicate query string parameters as arrays ([#497](https://github.com/sveltejs/sapper/issues/497))
* Don't buffer `stdout` and `stderr` ([#305](https://github.com/sveltejs/sapper/issues/305))
* Posixify `build_dir` ([#498](https://github.com/sveltejs/sapper/pull/498))
* Use `page[XY]Offset` instead of `scroll[XY]` ([#480](https://github.com/sveltejs/sapper/issues/480))

## 0.23.5

* Include lazily-imported CSS in main CSS chunk ([#492](https://github.com/sveltejs/sapper/pull/492))
* Make search param decoding spec-compliant ([#493](https://github.com/sveltejs/sapper/pull/493))
* Handle async route errors ([#488](https://github.com/sveltejs/sapper/pull/488))

## 0.23.4

* Ignore empty anchors when exporting ([#491](https://github.com/sveltejs/sapper/pull/491))

## 0.23.3

* Clear `error` and `status` on successful render ([#477](https://github.com/sveltejs/sapper/pull/477))

## 0.23.2

* Fix entry point CSS ([#471](https://github.com/sveltejs/sapper/pull/471))

## 0.23.1

* Scroll to deeplink that matches current URL ([#472](https://github.com/sveltejs/sapper/pull/472))
* Scroll to deeplink on another page ([#341](https://github.com/sveltejs/sapper/issues/341))

## 0.23.0

* Overhaul internal APIs ([#468](https://github.com/sveltejs/sapper/pull/468))
* Remove unused `sapper start` and `sapper upgrade` ([#468](https://github.com/sveltejs/sapper/pull/468))
* Remove magic environment variables ([#469](https://github.com/sveltejs/sapper/pull/469))
* Preserve SSI comments ([#470](https://github.com/sveltejs/sapper/pull/470))

## 0.22.10

* Handle `sapper-noscroll` attribute on `<a>` elements ([#376](https://github.com/sveltejs/sapper/issues/376))
* Fix CSS paths when using a base path ([#466](https://github.com/sveltejs/sapper/pull/466))

## 0.22.9

* Fix legacy builds ([#462](https://github.com/sveltejs/sapper/pull/462))

## 0.22.8

* Ensure CSS placeholders are overwritten ([#462](https://github.com/sveltejs/sapper/pull/462))

## 0.22.7

* Fix cookies ([#460](https://github.com/sveltejs/sapper/pull/460))

## 0.22.6

* Normalise chunk filenames on Windows ([#456](https://github.com/sveltejs/sapper/pull/456))
* Load modules with credentials ([#458](https://github.com/sveltejs/sapper/pull/458))

## 0.22.5

* Fix `sapper dev`. Oops.

## 0.22.4

* Ensure launcher does not overwrite a module ([#455](https://github.com/sveltejs/sapper/pull/455))

## 0.22.3

* Prevent server from accidentally importing dev client

## 0.22.2

* Make paths in generated code relative to project

## 0.22.1

* Fix `pkg.files`

## 0.22.0

* Move generated files into `__sapper__` ([#453](https://github.com/sveltejs/sapper/pull/453))
* Change default build and export directories to `__sapper__/build` and `__sapper__/export` ([#453](https://github.com/sveltejs/sapper/pull/453))

## 0.21.1

* Read template from build directory in production

## 0.21.0

* Change project folder structure ([#432](https://github.com/sveltejs/sapper/issues/432))
* Escape filenames ([#446](https://github.com/sveltejs/sapper/pull/446/))

## 0.20.4

* Fix legacy build CSS ([#439](https://github.com/sveltejs/sapper/issues/439))
* Enable debugging in Chrome and VSCode ([#435](https://github.com/sveltejs/sapper/issues/435))

## 0.20.3

* Inject `nonce` attribute if `res.locals.nonce` is present ([#424](https://github.com/sveltejs/sapper/pull/424))
* Prevent service worker caching ([#428](https://github.com/sveltejs/sapper/pull/428))
* Consistent caching for HTML responses ([#429](https://github.com/sveltejs/sapper/pull/429))

## 0.20.2

* Add `immutable` cache control header for hashed assets ([#425](https://github.com/sveltejs/sapper/pull/425))
* Handle value-less query string params ([#426](https://github.com/sveltejs/sapper/issues/426))

## 0.20.1

* Update shimport

## 0.20.0

* Decode `req.params` and `req.query` ([#417](https://github.com/sveltejs/sapper/issues/417))
* Decode URLs before writing files in `sapper export` ([#414](https://github.com/sveltejs/sapper/pull/414))
* Generate server sourcemaps for Rollup apps in dev mode ([#418](https://github.com/sveltejs/sapper/pull/418))

## 0.19.3

* Better unicode route handling ([#347](https://github.com/sveltejs/sapper/issues/347))

## 0.19.2

* Ignore editor tmp files ([#220](https://github.com/sveltejs/sapper/issues/220))
* Ignore clicks an `<a>` element without `href` ([#235](https://github.com/sveltejs/sapper/issues/235))
* Allow routes that are reserved JavaScript words ([#315](https://github.com/sveltejs/sapper/issues/315))
* Print out webpack errors ([#403](https://github.com/sveltejs/sapper/issues/403))

## 0.19.1

* Don't include local origin in export redirects ([#409](https://github.com/sveltejs/sapper/pull/409))

## 0.19.0

* Extract styles out of JS into .css files, for Rollup apps ([#388](https://github.com/sveltejs/sapper/issues/388))
* Fix `prefetchRoutes` ([#380](https://github.com/sveltejs/sapper/issues/380))

## 0.18.7

* Support differential bundling for Rollup apps via a `--legacy` flag ([#280](https://github.com/sveltejs/sapper/issues/280))

## 0.18.6

* Bundle missing dependency

## 0.18.5

* Bugfix

## 0.18.4

* Handle non-Sapper responses when exporting ([#382](https://github.com/sveltejs/sapper/issues/392))
* Add `--dev-port` flag to `sapper dev` ([#381](https://github.com/sveltejs/sapper/issues/381))

## 0.18.3

* Fix service worker Rollup build config

## 0.18.2

* Update `pkg.files`

## 0.18.1

* Add live reloading ([#385](https://github.com/sveltejs/sapper/issues/385))

## 0.18.0

* Rollup support ([#379](https://github.com/sveltejs/sapper/pull/379))
* Fail `export` if a page times out (configurable with `--timeout`) ([#378](https://github.com/sveltejs/sapper/pull/378))

## 0.17.1

* Print which file is causing build errors/warnings ([#371](https://github.com/sveltejs/sapper/pull/371))

## 0.17.0

* Use `cheap-watch` instead of `chokidar` ([#364](https://github.com/sveltejs/sapper/issues/364))

## 0.16.1

* Fix file watching regression in previous version

## 0.16.0

* Slim down installed package ([#363](https://github.com/sveltejs/sapper/pull/363))

## 0.15.8

* Only set `preloading: true` on navigation, not prefetch ([#352](https://github.com/sveltejs/sapper/issues/352))
* Provide fallback for missing preload errors ([#361](https://github.com/sveltejs/sapper/pull/361))

## 0.15.7

* Strip leading slash from redirects ([#291](https://github.com/sveltejs/sapper/issues/291))
* Pass `(req, res)` to store getter ([#344](https://github.com/sveltejs/sapper/issues/344))

## 0.15.6

* Fix exporting with custom basepath ([#342](https://github.com/sveltejs/sapper/pull/342))

## 0.15.5

* Faster `export` with more explanatory output ([#335](https://github.com/sveltejs/sapper/pull/335))
* Only blur `activeElement` if it exists ([#332](https://github.com/sveltejs/sapper/issues/332))
* Don't emit `client_info.json` or `server_info.json` ([#318](https://github.com/sveltejs/sapper/issues/318))

## 0.15.4

* Add `ignore` option ([#326](https://github.com/sveltejs/sapper/pull/326))

## 0.15.3

* Crawl pages in parallel when exporting ([#329](https://github.com/sveltejs/sapper/pull/329))
* Don't minify inline JS when exporting ([#328](https://github.com/sveltejs/sapper/pull/328))

## 0.15.2

* Collapse component chains where no intermediate layout component is specified ([#312](https://github.com/sveltejs/sapper/issues/312))

## 0.15.1

* Prevent confusing error when no root layout is specified

## 0.15.0

* Nested routes (consult [migration guide](https://sapper.svelte.technology/guide#0-14-to-0-15) and docs on [layouts](https://sapper.svelte.technology/guide#layouts)) ([#262](https://github.com/sveltejs/sapper/issues/262))

## 0.14.2

* Prevent unsafe replacements ([#307](https://github.com/sveltejs/sapper/pull/307))

## 0.14.1

* Route parameters can be qualified with regex characters ([#283](https://github.com/sveltejs/sapper/pull/283))

## 0.14.0

* `4xx.html` and `5xx.html` are replaced with `_error.html` ([#209](https://github.com/sveltejs/sapper/issues/209))
* Treat `foo/index.json.js` and `foo.json.js` as equivalents ([#297](https://github.com/sveltejs/sapper/issues/297))
* Return a promise from `goto` ([#270](https://github.com/sveltejs/sapper/issues/270))
* Use store when rendering error pages ([#293](https://github.com/sveltejs/sapper/issues/293))
* Prevent console errors when visiting an error page ([#279](https://github.com/sveltejs/sapper/issues/279))

## 0.13.6

* Fix `baseUrl` synthesis ([#296](https://github.com/sveltejs/sapper/issues/296))

## 0.13.5

* Fix handling of fatal errors ([#289](https://github.com/sveltejs/sapper/issues/289))

## 0.13.4

* Focus `<body>` after navigation ([#287](https://github.com/sveltejs/sapper/issues/287))
* Fix timing of hot reload updates
* Emit `fatal` event if server crashes ([#285](https://github.com/sveltejs/sapper/pull/285))
* Emit `stdout` and `stderr` events on dev watcher ([#285](https://github.com/sveltejs/sapper/pull/285))
* Always refresh client assets in dev ([#286](https://github.com/sveltejs/sapper/pull/286))
* Correctly initialise rebuild stats

## 0.13.3

* Make `fatal` events clonable for IPC purposes

## 0.13.2

* Emit a `basepath` event ([#284](https://github.com/sveltejs/sapper/pull/284))

## 0.13.1

* Reinstate ten-second interval between dev server heartbeats ([#276](https://github.com/sveltejs/sapper/issues/276))

## 0.13.0

* Expose `dev`, `build`, `export` and `find_page` APIs ([#272](https://github.com/sveltejs/sapper/issues/272))

## 0.12.0

* Each app has a single `<App>` component. See the [migration guide](https://sapper.svelte.technology/guide#0-11-to-0-12) for more information ([#157](https://github.com/sveltejs/sapper/issues/157))
* Process exits with error code 1 if build/export fails ([#208](https://github.com/sveltejs/sapper/issues/208))

## 0.11.1

* Limit routes with leading dots to `.well-known` URIs ([#252](https://github.com/sveltejs/sapper/issues/252))
* Allow server routes to sit in front of pages ([#236](https://github.com/sveltejs/sapper/pull/236))

## 0.11.0

* Create launcher file ([#240](https://github.com/sveltejs/sapper/issues/240))
* Only keep necessary parts of webpack stats ([#251](https://github.com/sveltejs/sapper/pull/251))
* Allow `NODE_ENV` to be overridden when building ([#241](https://github.com/sveltejs/sapper/issues/241))

## 0.10.7

* Allow routes to have a leading `.` ([#243](https://github.com/sveltejs/sapper/pull/243))
* Only encode necessary characters in routes ([#234](https://github.com/sveltejs/sapper/pull/234))
* Preserve existing `process.env` when exporting ([#245](https://github.com/sveltejs/sapper/pull/245))

## 0.10.6

* Fix error reporting in `sapper start`

## 0.10.5

* Fix missing service worker ([#231](https://github.com/sveltejs/sapper/pull/231))

## 0.10.4

* Upgrade chokidar, this time with a fix ([#227](https://github.com/sveltejs/sapper/pull/227))

## 0.10.3

* Downgrade chokidar ([#212](https://github.com/sveltejs/sapper/issues/212))

## 0.10.2

* Attach `store` to error pages
* Fix sorting edge case ([#215](https://github.com/sveltejs/sapper/pull/215))

## 0.10.1

* Fix server-side `fetch` paths ([#207](https://github.com/sveltejs/sapper/pull/207))

## 0.10.0

* Support mounting on a path (this requires `app/template.html` to include `%sapper.base%`) ([#180](https://github.com/sveltejs/sapper/issues/180))
* Support per-request server-side `Store` with client-side hydration ([#178](https://github.com/sveltejs/sapper/issues/178))
* Add `this.fetch` to `preload`, with credentials support ([#178](https://github.com/sveltejs/sapper/issues/178))
* Exclude sourcemaps from preload links and `<script>` block ([#204](https://github.com/sveltejs/sapper/pull/204))
* Register service worker in `<script>` block


## 0.9.6

* Whoops — `tslib` is a runtime dependency

## 0.9.5

* Stringify clorox output ([#197](https://github.com/sveltejs/sapper/pull/197))

## 0.9.4

* Add `SAPPER_BASE` and `SAPPER_APP` environment variables ([#181](https://github.com/sveltejs/sapper/issues/181))
* Minify template in `sapper build` ([#15](https://github.com/sveltejs/sapper/issues/15))
* Minify all HTML files in `sapper export` ([#172](https://github.com/sveltejs/sapper/issues/172))
* Log exported files ([#195](https://github.com/sveltejs/sapper/pull/195))
* Add `--open`/`-o` flag to `sapper dev` and `sapper start` ([#186](https://github.com/sveltejs/sapper/issues/186))

## 0.9.3

* Fix path to `sapper-dev-client`

## 0.9.2

* Include `dist` files in package

## 0.9.1

* Include `sapper` bin

## 0.9.0

* Use `devalue` instead of `serialize-javascript`, allowing `preload` to return non-POJOs and cyclical/repeated references, but *not* functions ([#112](https://github.com/sveltejs/sapper/issues/112))
* Kill child process if webpack crashes ([#177](https://github.com/sveltejs/sapper/issues/177))
* Support HMR on remote devices ([#165](https://github.com/sveltejs/sapper/issues/165))
* Remove hard-coded port (([#169](https://github.com/sveltejs/sapper/issues/169)))
* Allow non-JS files, e.g. TypeScript to be used as entry points and server routes ([#57](https://github.com/sveltejs/sapper/issues/57))
* Faster startup ([#173](https://github.com/sveltejs/sapper/issues/173))

## 0.8.4

* Fix route sorting ([#175](https://github.com/sveltejs/sapper/pull/175))

## 0.8.3

* Automatically select available port, or use `--port` flag for `dev` and `start` ([#169](https://github.com/sveltejs/sapper/issues/169))
* Show stats after build/export ([#168](https://github.com/sveltejs/sapper/issues/168))
* Various CLI improvements ([#170](https://github.com/sveltejs/sapper/pull/170))

## 0.8.2

* Rename `preloadRoutes` to `prefetchRoutes` ([#166](https://github.com/sveltejs/sapper/issues/166))

## 0.8.1

* Add `sapper start` command, for running an app built with `sapper build` ([#163](https://github.com/sveltejs/sapper/issues/163))

## 0.8.0

* Update to webpack 4
* Add `preloadRoutes` function — secondary routes are no longer automatically preloaded ([#160](https://github.com/sveltejs/sapper/issues/160))
* `sapper build` outputs to `build`, `sapper build custom-dir` outputs to `custom-dir` ([#150](https://github.com/sveltejs/sapper/pull/150))
* `sapper export` outputs to `export`, `sapper export custom-dir` outputs to `custom-dir` ([#150](https://github.com/sveltejs/sapper/pull/150))
* Improved logging ([#158](https://github.com/sveltejs/sapper/pull/158))
* URI-encode routes ([#103](https://github.com/sveltejs/sapper/issues/103))
* Various performance and stability improvements ([#152](https://github.com/sveltejs/sapper/pull/152))

## 0.7.6

* Prevent client-side navigation to server route ([#145](https://github.com/sveltejs/sapper/issues/145))
* Don't serve error page for server route errors ([#138](https://github.com/sveltejs/sapper/issues/138))

## 0.7.5

* Allow dynamic parameters inside route parts ([#139](https://github.com/sveltejs/sapper/issues/139))

## 0.7.4

* Force `NODE_ENV='production'` when running `build` or `export` ([#141](https://github.com/sveltejs/sapper/issues/141))
* Use source-map-support ([#134](https://github.com/sveltejs/sapper/pull/134))

## 0.7.3

* Handle webpack assets that are arrays instead of strings ([#131](https://github.com/sveltejs/sapper/pull/131))
* Wait for new server to start before broadcasting HMR update ([#129](https://github.com/sveltejs/sapper/pull/129))

## 0.7.2

* Add `hmr-client.js` to package
* Wait until first successful client build before creating service-worker.js

## 0.7.1

* Add missing `tslib` dependency

## 0.7.0

* Restructure app layout (see [migration guide](https://sapper.svelte.technology/guide#0-6-to-0-7)) ([#126](https://github.com/sveltejs/sapper/pull/126))
* Support `this.redirect(status, location)` and `this.error(status, error)` in `preload` functions ([#127](https://github.com/sveltejs/sapper/pull/127))
* Add `sapper dev` command
* Add `sapper --help` command

## 0.6.4

* Prevent phantom HMR requests in production mode ([#114](https://github.com/sveltejs/sapper/pull/114))

## 0.6.3

* Ignore non-HTML responses when crawling during `export`
* Build in prod mode for `export`

## 0.6.2

* Handle unspecified type in `sapper export`

## 0.6.1

* Fix `pkg.files` and `pkg.bin`

## 0.6.0

* Hydrate on first load, and only on first load ([#93](https://github.com/sveltejs/sapper/pull/93))
* Identify clashes between page and server routes ([#96](https://github.com/sveltejs/sapper/pull/96))
* Remove Express-specific utilities, for compatbility with Polka et al ([#94](https://github.com/sveltejs/sapper/issues/94))
* Return a promise from `init` when first page has rendered ([#99](https://github.com/sveltejs/sapper/issues/99))
* Handle invalid hash links ([#104](https://github.com/sveltejs/sapper/pull/104))
* Avoid `URLSearchParams` ([#107](https://github.com/sveltejs/sapper/pull/107))
* Don't automatically set `Content-Type` for server routes ([#111](https://github.com/sveltejs/sapper/pull/111))
* Handle empty query string routes, e.g. `/?` ([#105](https://github.com/sveltejs/sapper/pull/105))

## 0.5.1

* Only write service-worker.js to filesystem in dev mode ([#90](https://github.com/sveltejs/sapper/issues/90))

## 0.5.0

* Experimental support for `sapper export` ([#9](https://github.com/sveltejs/sapper/issues/9))
* Lazily load chokidar, for faster startup ([#64](https://github.com/sveltejs/sapper/pull/64))

## 0.4.0

* `%sapper.main%` has been replaced with `%sapper.scripts%` ([#86](https://github.com/sveltejs/sapper/issues/86))
* Node 6 support ([#67](https://github.com/sveltejs/sapper/pull/67))
* Explicitly load css-loader and style-loader ([#72](https://github.com/sveltejs/sapper/pull/72))
* DELETE requests are handled with `del` exports ([#77](https://github.com/sveltejs/sapper/issues/77))
* Send preloaded data for first route to client, where possible ([#3](https://github.com/sveltejs/sapper/issues/3))

## 0.3.2

* Expose `prefetch` function ([#61](https://github.com/sveltejs/sapper/pull/61))

## 0.3.1

* Fix missing `runtime.js`

## 0.3.0

* Move `sapper/runtime/app.js` to `sapper/runtime.js`
* Cancel navigation if overtaken by second navigation ([#48](https://github.com/sveltejs/sapper/issues/48))
* Store preloaded data, to avoiding double prefetching ([#49](https://github.com/sveltejs/sapper/issues/49))
* Pass server request object to `preload` ([#54](https://github.com/sveltejs/sapper/pull/54))
* Nested routes ([#55](https://github.com/sveltejs/sapper/issues/55))

## 0.2.10

* Handle deep links correctly ([#44](https://github.com/sveltejs/sapper/issues/44))

## 0.2.9

* Don't write files to disk in prod mode

## 0.2.8

* Add `goto` function ([#29](https://github.com/sveltejs/sapper/issues/29))
* Don't use `/tmp` as destination in Now environments

## 0.2.7

* Fix streaming bug

## 0.2.6

* Render main.js back to templates, to allow relative imports ([#40](https://github.com/sveltejs/sapper/issues/40))

## 0.2.5

* Fix nested routes on Windows ([#39](https://github.com/sveltejs/sapper/pull/39))
* Rebundle when routes and main.js change ([#34](https://github.com/sveltejs/sapper/pull/34))
* Add `Link...preload` headers for JavaScript assets ([#2](https://github.com/sveltejs/sapper/issues/2))
* Stream document up to first dynamic content ([#19](https://github.com/sveltejs/sapper/issues/19))
* Error if routes clash ([#33](https://github.com/sveltejs/sapper/issues/33))

## 0.2.4

* Posixify path to HMR client

## 0.2.3

* Posixify import paths, even on Windows ([#31](https://github.com/sveltejs/sapper/pull/31))
* Pass `url` to 404 handler

## 0.2.2

* Create destination directory when building, don't assume it's already there from dev mode
* We have tests now!

## 0.2.1

* Inject HMR logic in dev mode

## 0.2.0

* Separate `sapper build` from prod server ([#21](https://github.com/sveltejs/sapper/issues/21))

## 0.1.3-5

* Fix typo

## 0.1.2

* Use `atime.getTime()` and `mtime.getTime()` instead of `atimeMs` and `mtimeMs` ([#11](https://github.com/sveltejs/sapper/issues/11))
* Make dest dir before anyone tries to write to it ([#18](https://github.com/sveltejs/sapper/pull/18))

## 0.1.1

* Expose resolved pathname to `sapper/runtime/app.js` as `__app__` inside main.js

## 0.1.0

* First public preview
