import typescript from 'rollup-plugin-typescript';
import string from 'rollup-plugin-string';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';
import { builtinModules } from 'module';

const external = [].concat(
	Object.keys(pkg.dependencies),
	Object.keys(process.binding('natives')),
	'sapper/core.js'
);

function template(kind, external, target) {
	return {
		input: `templates/src/${kind}/index.ts`,
		output: {
			file: `templates/${kind}.js`,
			format: 'es'
		},
		external,
		plugins: [
			resolve(),
			commonjs(),
			string({
				include: '**/*.md'
			}),
			typescript({
				typescript: require('typescript'),
				target
			})
		]
	};
}

export default [
	template('client', ['__ROOT__', '__ERROR__'], 'ES2017'),
	template('server', builtinModules, 'ES2015'),

	{
		input: [
			`src/api.ts`,
			`src/cli.ts`,
			`src/core.ts`,
			`src/config/rollup.ts`,
			`src/config/webpack.ts`
		],
		output: {
			dir: 'dist',
			format: 'cjs',
			sourcemap: true
		},
		external,
		plugins: [
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