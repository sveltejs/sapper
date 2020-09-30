module.exports = {
	root: true,
	extends: [
		'@sveltejs'
	],
	plugins: ['import'],
	settings: {
		'import/resolver': {
			typescript: {} // this loads <rootdir>/tsconfig.json to eslint
		}
	},
	rules: {
		indent: ['error', 'tab'],
		'brace-style': ['error', '1tbs'],
		'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }]
	}
};
