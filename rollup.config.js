import path from 'path';
import typescript from 'rollup-plugin-typescript';
import string from 'rollup-plugin-string';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

console.log('WE ARE INSIDE THE ROLLUP CONFIG');

const external = [].concat(
	Object.keys(pkg.dependencies),
	Object.keys(process.binding('natives')),
	'sapper/core.js'
);

export default [
	{
		input: `src/runtime/index.ts`,
		output: {
			file: `./runtime.js`,
			format: 'es'
		},
		plugins: [
			typescript({
				typescript: require('typescript'),
				target: "ES2017"
			})
		]
	},

	{
		input: [
			`src/api.ts`,
			`src/cli.ts`,
			`src/core.ts`,
			`src/middleware.ts`,
			`src/rollup.ts`,
			`src/webpack.ts`
		],
		output: {
			dir: './dist',
			format: 'cjs',
			sourcemap: true
		},
		external,
		plugins: [
			string({
				include: '**/*.md'
			}),
			json(),
			resolve(),
			commonjs(),
			typescript({
				typescript: require('typescript')
			})
		],
		experimentalCodeSplitting: true
	}
];