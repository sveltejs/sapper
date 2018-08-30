import * as fs from 'fs';

export default function validate_bundler(bundler?: string) {
	if (!bundler) {
		bundler = (
			fs.existsSync('rollup') ? 'rollup' :
			fs.existsSync('webpack') ? 'webpack' :
			null
		);

		if (!bundler) {
			throw new Error(`Could not find a 'rollup' or 'webpack' directory`);
		}
	}

	if (bundler !== 'rollup' && bundler !== 'webpack') {
		throw new Error(`'${bundler}' is not a valid option for --bundler — must be either 'rollup' or 'webpack'`);
	}

	return bundler;
}