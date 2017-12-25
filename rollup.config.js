import typescript from 'rollup-plugin-typescript';

export default [
	// runtime.js
	{
		input: 'src/runtime/index.ts',
		output: {
			file: 'runtime.js',
			format: 'es'
		},
		plugins: [
			typescript({
				typescript: require('typescript')
			})
		]
	}
];