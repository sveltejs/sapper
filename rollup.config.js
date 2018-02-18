import typescript from 'rollup-plugin-typescript';
import string from 'rollup-plugin-string';
import json from 'rollup-plugin-json';
import pkg from './package.json';

const external = [].concat(
	Object.keys(pkg.dependencies),
	Object.keys(process.binding('natives')),
	'sapper/core.js'
);

const paths = {
	'sapper/core.js': './core.js'
};

const plugins = [
	string({
		include: '**/*.md'
	}),
	json(),
	typescript({
		typescript: require('typescript')
	})
];

export default [
	{ name: 'cli', banner: true },
	{ name: 'core' },
	{ name: 'middleware' },
	{ name: 'runtime', format: 'es' },
	{ name: 'webpack', file: 'webpack/config' }
].map(obj => ({
	input: `src/${obj.name}/index.ts`,
	output: {
		file: `${obj.file || obj.name}.js`,
		format: obj.format || 'cjs',
		banner: obj.banner && '#!/usr/bin/env node',
		paths,
		sourcemap: true
	},
	external,
	plugins
}));
