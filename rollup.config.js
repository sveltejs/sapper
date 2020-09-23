import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import { builtinModules } from 'module';
import { readdirSync } from 'fs';

const external = [].concat(
	Object.keys(pkg.dependencies),
	Object.keys(process.binding('natives')),
	'sapper/core.js',
	'svelte/compiler'
);

const tsOptions = {
	check: !!process.env.TS_CHECK_ENABLED,
	tsconfigOverride: {
		compilerOptions: { module: 'esnext' }
	}
};

function template(kind, external, module) {
	return {
		input: `runtime/src/${kind}/${module || 'index'}.ts`,
		output: {
			file: `runtime/${module || kind}.mjs`,
			format: 'es',
			paths: id => {
				const m = id.match(new RegExp(`runtime\\/src\\/${kind}\\/([^/]*)$`));

				if (m) {
					return './' + m[1];
				}
				else {
					return id.replace('@sapper', '.');
				}
			}
		},
		external,
		plugins: [
			resolve({
				extensions: ['.mjs', '.js', '.ts', '.json']
			}),
			commonjs(),
			typescript(tsOptions)
		]
	};
}

const clientModules = readdirSync('./runtime/src/app')
	.filter(f => f.includes('.ts'))
	.map(f => f.replace('.ts', ''));

export default [
	...clientModules.map(module =>
		template('app', id => id.startsWith('./') || /^(svelte\/?|@sapper\/)/.test(id), module)
	),
	template('server', id => /^(svelte\/?|@sapper\/)/.test(id) || builtinModules.includes(id)),

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
			sourcemap: true,
			chunkFileNames: '[name].js'
		},
		external,
		plugins: [
			json(),
			resolve({
				extensions: ['.mjs', '.js', '.ts']
			}),
			commonjs(),
			typescript(tsOptions)
		]
	}
];
