import * as fs from 'fs';

export default function validate_bundler(bundler?: 'rollup' | 'webpack') {
	if (!bundler) {
		bundler = (
			fs.existsSync('rollup.config.js') || fs.existsSync('rollup.config.ts') ? 'rollup' :
				fs.existsSync('webpack.config.js') || fs.existsSync('webpack.config.ts') ? 'webpack' : null
		);

		if (!bundler) {
			// TODO remove in a future version
			deprecate_dir('rollup');
			deprecate_dir('webpack');

			throw new Error('Could not find a configuration file for rollup or webpack');
		}
	}

	if (bundler !== 'rollup' && bundler !== 'webpack') {
		throw new Error(`'${bundler}' is not a valid option for --bundler — must be either 'rollup' or 'webpack'`);
	}

	return bundler;
}

function deprecate_dir(bundler: 'rollup' | 'webpack') {
	try {
		const stats = fs.statSync(bundler);
		if (!stats.isDirectory()) return;
	} catch (err) {
		// do nothing
		return;
	}

	// TODO link to docs, once those docs exist
	throw new Error(`As of Sapper 0.21, build configuration should be placed in a single ${bundler}.config.js file`);
}
