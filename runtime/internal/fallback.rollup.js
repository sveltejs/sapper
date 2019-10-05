// fallback rollup.config.js

import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'
import { terser } from 'rollup-plugin-terser'
import { mdsvex } from 'mdsvex'
import path from 'path'
import fs from 'fs'
// import produce from 'immer'
const mode = process.env.NODE_ENV
const dev = mode === 'development'
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const config = require('../../config/rollup.js')

// replacement for `import pkg from './package.json'`
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))

let clientInput = config.client.input()
let serverInput = config.server.input()
let swInput = config.serviceworker.input() //'node_modules/ssg/defaultSrcFiles/service-worker.js',

if (!fs.existsSync(clientInput)) clientInput = path.resolve(__dirname, './client.js') // fallback
if (!fs.existsSync(serverInput)) serverInput = path.resolve(__dirname, './server.js') // fallback
if (!fs.existsSync(swInput)) swInput = path.resolve(__dirname, './service-worker.js') // fallback

const onwarn = (warning, onwarn) =>
  (warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) || onwarn(warning)
const dedupe = (importee) => importee === 'svelte' || importee.startsWith('svelte/')

const extensions = ['.svelte', '.svexy', '.svx', '.md']
const preprocess = mdsvex({
  // extension: '.svexy', // the default is '.svexy', if you lack taste, you might want to change it
  // layout: path.join(__dirname, './src/routes/_layout.svelte'), // this needs to be an absolute path
  // parser: md => md.use(SomePlugin), // you can add markdown-it plugins if the feeling takes you
  // // you can add markdown-it options here, html is always true
  // markdownOptions: {
  // 	typographer: true,
  // 	linkify: true,
  // 	highlight: (str, lang) => whatever(str, lang), // this should be a real function if you want to highlight
  // },
})

const defaultRollupConfig = {
  client: {
    input: clientInput,
    output: config.client.output(),
    plugins: [
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      svelte({
        dev,
        hydratable: true,
        emitCss: true,
        extensions, // defined above
        preprocess, // defined above
      }),
      resolve(),
      // resolve({
      //   browser: true,
      //   dedupe,
      // }),
      commonjs(),
      // json(),
      legacy &&
        babel({
          extensions: ['.js', '.mjs', '.html', '.svelte'],
          runtimeHelpers: true,
          exclude: ['node_modules/@babel/**'],
          presets: [
            [
              '@babel/preset-env',
              {
                targets: '> 0.25%, not dead',
              },
            ],
          ],
          plugins: [
            '@babel/plugin-syntax-dynamic-import',
            [
              '@babel/plugin-transform-runtime',
              {
                useESModules: true,
              },
            ],
          ],
        }),

      !dev &&
        terser({
          module: true,
        }),
    ],

    onwarn,
  },

  server: {
    input: serverInput,
    output: config.server.output(),
    plugins: [
      replace({
        'process.browser': false,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      json(),
      svelte({
        generate: 'ssr',
        dev,
        extensions, // defined above
        preprocess, // defined above
      }),
      resolve(),
      // resolve({
      //   dedupe,
      // }),
      commonjs(),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require('module').builtinModules || Object.keys(process.binding('natives')),
    ),

    onwarn,
  },

  serviceworker: {
    input: swInput,
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      commonjs(),
      !dev && terser(),
    ],

    onwarn,
  },
}

// // call this function with no arguments to just get a default rollup config
// // export default (modifier) => {
// export default async function() {
//   return defaultRollupConfig
//   // if (modifier) {
//   //   return produce(defaultRollupConfig, modifier)
//   // } else {
//   //   return defaultRollupConfig
//   // }
// }
export default defaultRollupConfig
