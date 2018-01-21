import typescript from 'rollup-plugin-typescript';
import pkg from './package.json';

const external = [].concat(
	Object.keys(pkg.dependencies),
	Object.keys(process.binding('natives'))
);

export default [
	// cli.js
	{
		input: 'src/cli/index.js',
		output: {
			file: 'cli.js',
			format: 'cjs',
			banner: '#!/usr/bin/env node'
		},
		external,
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	},

	// core.js
	// {
	// 	input: 'src/core/index.js',
	// 	output: {
	// 		file: 'core.js',
	// 		format: 'cjs',
	// 		banner: '#!/usr/bin/env node'
	// 	},
	// 	external,
	// 	plugins: [
	// 		typescript({
	// 			typescript: require('typescript')
	// 		})
	// 	]
	// },

	// middleware.js
	{
		input: 'src/middleware/index.js',
		output: {
			file: 'middleware.js',
			format: 'cjs'
		},
		external,
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	},

	// runtime.js
	{
		input: 'src/runtime/index.ts',
		output: {
			file: 'runtime.js',
			format: 'es'
		},
		external,
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	},

	// webpack/config.js
	{
		input: 'src/webpack/index.js',
		output: {
			file: 'webpack/config.js',
			format: 'cjs'
		},
		external,
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	}
];