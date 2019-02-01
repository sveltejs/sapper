import sucrase from 'rollup-plugin-sucrase';
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

function template(kind, external) {
	return {
		input: `templates/src/${kind}/index.ts`,
		output: {
			file: `templates/${kind}.mjs`,
			format: 'es',
			paths: id => id.replace('@sapper', '.')
		},
		external,
		plugins: [
			resolve({
				extensions: ['.js', '.ts']
			}),
			commonjs(),
			string({
				include: '**/*.md'
			}),
			sucrase({
				transforms: ['typescript']
			})
		]
	};
}

export default [
	template('app', ['__ROOT__', '__ERROR__', 'svelte', '@sapper/App.html']),
	template('server', builtinModules),

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
			resolve({
				extensions: ['.js', '.ts']
			}),
			commonjs(),
			sucrase({
				transforms: ['typescript']
			})
		]
	}
];