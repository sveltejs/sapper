import typescript from 'rollup-plugin-typescript';
import string from 'rollup-plugin-string';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

const external = [].concat(
	Object.keys(pkg.dependencies),
	Object.keys(process.binding('natives')),
	'sapper/core.js'
);

export default [
	{
		input: `src/runtime/index.ts`,
		output: {
			file: `runtime.js`,
			format: 'es'
		},
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	},

	{
		input: [
			`src/api.ts`,
			`src/cli.ts`,
			`src/core.ts`,
			`src/middleware.ts`,
			`src/webpack.ts`
		],
		output: {
			dir: 'dist',
			format: 'cjs',
			sourcemap: true
		},
		external,
		plugins: [
			string({
				include: '**/*.md'
			}),
			json(),
			commonjs(),
			typescript({
				typescript: require('typescript')
			})
		],
		experimentalCodeSplitting: true,
		experimentalDynamicImport: true
	}
];