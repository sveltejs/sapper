import * as path from 'path';
import relative from 'require-relative';

export default function create_compilers() {
	const webpack = relative('webpack', process.cwd());

	const serviceworker_config = try_require(path.resolve('webpack/service-worker.config.js'));

	return {
		client: webpack(
			require(path.resolve('webpack/client.config.js'))
		),

		server: webpack(
			require(path.resolve('webpack/server.config.js'))
		),

		serviceworker: serviceworker_config && webpack(serviceworker_config)
	};
}

function try_require(specifier: string) {
	try {
		return require(specifier);
	} catch (err) {
		if (err.code === 'MODULE_NOT_FOUND') return null;
		throw err;
	}
}