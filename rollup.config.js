import typescript from 'rollup-plugin-typescript';
import pkg from './package.json';

const external = [].concat(
	Object.keys(pkg.dependencies),
	Object.keys(process.binding('natives')),
	'sapper/core.js'
);

const paths = {
	'sapper/core.js': './core.js'
};

export default [
	// cli.js
	{
		input: 'src/cli/index.js',
		output: {
			file: 'cli.js',
			format: 'cjs',
			banner: '#!/usr/bin/env node',
			paths,
			sourcemap: true
		},
		external,
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	},

	// core.js
	{
		input: 'src/core/index.js',
		output: {
			file: 'core.js',
			format: 'cjs',
			banner: '#!/usr/bin/env node',
			paths,
			sourcemap: true
		},
		external,
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	},

	// middleware.js
	{
		input: 'src/middleware/index.js',
		output: {
			file: 'middleware.js',
			format: 'cjs',
			paths,
			sourcemap: true
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
			format: 'es',
			paths,
			sourcemap: true
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
			format: 'cjs',
			paths,
			sourcemap: true
		},
		external,
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	}
];