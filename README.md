# sapper

[Military-grade progressive web apps, powered by Svelte.](https://sapper.svelte.dev)


## What is Sapper?

Sapper is a framework for building high-performance universal web apps. [Read the guide](https://sapper.svelte.dev/docs) or the [introductory blog post](https://svelte.dev/blog/sapper-towards-the-ideal-web-app-framework) to learn more.


## Get started

Clone the [starter project template](https://github.com/sveltejs/sapper-template) with [degit](https://github.com/rich-harris/degit)...
When cloning you have to choose between rollup or webpack:

```bash
npx degit "sveltejs/sapper-template#rollup" my-app
# or: npx degit "sveltejs/sapper-template#webpack" my-app
```

...then install dependencies and start the dev server...

```bash
cd my-app
npm install
npm run dev
```

...and navigate to [localhost:3000](http://localhost:3000). To build and run in production mode:

```bash
npm run build
npm start
```

## Development

Pull requests are encouraged and always welcome. [Pick an issue](https://github.com/sveltejs/sapper/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc) and help us out!

To install and work on Sapper locally:

```bash
git clone git@github.com:sveltejs/sapper.git
cd sapper
npm install
npm run dev
```

### Linking to a Live Project

You can make changes locally to Sapper and test it against a local Sapper project. For a quick project that takes almost no setup, use the default [sapper-template](https://github.com/sveltejs/sapper-template) project. Instruction on setup are found in that project repository.

To link Sapper to your project, from the root of your local Sapper git checkout:

```bash
cd sapper
npm link
```

Then, to link from `sapper-template` (or any other given project):

```bash
cd sapper-template
npm link sapper
```

You should be good to test changes locally.

### Running Tests

```bash
npm run test
```

## License

[MIT](LICENSE)
