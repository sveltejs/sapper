---
title: CLI API
---

Sapper ships a small CLI that you can use to build, serve, and export your Sapper apps:

- `sapper dev`: spin up a local dev server locally with hot reloading
- `sapper build`: build a Sapper app that can be deployed on a Node server
- `sapper export`: export a Sapper app as a static site, prefetching data

In the CLI, you can pass flags to each command, e.g. `sapper dev --legacy --ext ".svelte .html"`. Here is a full list of common API flags/options and what they do:

- `cwd` (`string`): the current working directory. Default `.`
- `src` (`string`): the source to build from. Default `src`
- `dest` (`string`): the folder to build to. Default `__sapper__/build`
- `routes` (`string`): the routes folder to build from. Default `src/routes`
- `output` (`string`): the output folder to build to. Default `src/node_modules/@sapper`
- `static` (`string`): the output folder for static files. Default `static`
- `bundler`: can be either `rollup` or `webpack`. Default: automatically determined
- `ext` (`string`): space separated string of file extensions to read, e.g. `--ext ".svelte .html"`. Default: `.svelte`. Remember you will also have to configure your webpack/rollup client and server `extensions` accordingly.

Options specific to `sapper dev`:

- `dev-port` (`number`): set the port for dev
- `devtools-port` (`number`): set the port for devtools
- `port` (`number`): set yet another port. Default `process.env.PORT`
- `hot` (`boolean`): toggle hot reloading
- `live` (`boolean`): toggle live

Options specific to `sapper build`:

- `legacy`: create legacy bundle in addition to modern JS bundle. Default `false`.

Lastly, `sapper export` inherits the same options as `sapper build`, plus these specific ones:

- `build_dir` (`string`): set build dir. Default `__sapper__/build`
- `export_dir` (`string`): set export dir. Default `__sapper__/export`.
- `host_header` (`string`): set host header
- `timeout` (`number | false`): set timeout for prefetches. Default `5000`.
- `concurrent` (`number`): set number of concurrent builds. Default `8`.
- `entry` (`string`): Set entry point of your static site, in case it is hosted at a subdirectory. It takes a space separated string of entries, e.g. `--entry "/ /reports /marketing/2019"`. Sapper will crawl each of these entry points. You want this if you don't have links to a certain part of your app but want it statically built for whatever reason then it solves that case. Default `/`
