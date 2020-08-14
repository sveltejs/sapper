import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import { builtinModules } from 'module';

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

function template(kind, external) {
	return {
		input: `runtime/src/${kind}/index.ts`,
		output: {
			file: `runtime/${kind}.mjs`,
			format: 'es',
			paths: id => id.replace('@sapper', '.')
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

export default [
	template('app', id => /^(svelte\/?|@sapper\/)/.test(id)),
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
