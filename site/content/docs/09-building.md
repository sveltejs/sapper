---
title: Building
---

Up until now we've been using `sapper dev` to build our application and run a development server. But when it comes to production, we want to create a self-contained optimized build.

### sapper build

This command packages up your application into the `__sapper__/build` directory. (You can change this to a custom directory, as well as controlling various other options — do `sapper build --help` for more information.)

The output is a Node app that you can run from the project root:

```bash
node __sapper__/build
```

Options can be passed in via the CLI's flags, e.g. `sapper build --cwd MySpecialDir`, or via the API, e.g. `api.build({ cwd: __dirname })`.

- `port`: the port used by the build process (default `3000`)
- `bundler`: either `rollup` or `webpack` (default auto)
- `legacy`: create a separate legacy build in addition to modern JS build (default `false`)
- `cwd`: set current working directory (default `.`)
- `src`: set source directory (default `src`)
- `routes`: set routes directory (default `src/routes`)
- `output`: set Sapper intermediate file output directory (default `src/node_modules/@sapper`)
- `ext`: Custom page route extensions (space separated) (default `.svelte .html`)
