module.exports = {
	root: true,
	extends: '@sveltejs',
	plugins: ['import'],
	settings: {
		'import/resolver': {
			typescript: {} // this loads <rootdir>/tsconfig.json to eslint
		}
	}
};
