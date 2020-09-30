module.exports = {
	root: true,
	extends: [
		'@sveltejs',
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended'
	],
	plugins: ['import'],
	settings: {
		'import/resolver': {
			typescript: {} // this loads <rootdir>/tsconfig.json to eslint
		}
	},
	rules: {
		indent: ['error', 'tab'],
		'a11y-invalid-attribute': 'off',
		'a11y-missing-attribute': 'off',
		'@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
		'@typescript-eslint/ban-types': 'off',
		'@typescript-eslint/no-var-requires': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-empty-function': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off'
	}
};
