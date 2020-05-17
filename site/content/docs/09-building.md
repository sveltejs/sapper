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

### Browser support

By default, Sapper builds your site only for the latest versions of modern evergreen browsers.

For older browsers, like Internet Explorer, you will need to use the `--legacy` flag:

```
npx sapper build --legacy
```

You will also need to polyfill APIs that are not present in older browsers.
