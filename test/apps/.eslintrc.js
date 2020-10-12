module.exports = {
	rules: {
		/* The @sapper/service-worker dependency is missing in all the tests if they haven't been built yet. */
		'import/no-unresolved': 'off'
	}
};
