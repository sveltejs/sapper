import * as path from 'path';
import relative from 'require-relative';

export default function create_compilers() {
	const webpack = relative('webpack', process.cwd());

	return {
		client: webpack(
			require(path.resolve('webpack/client.config.js'))
		),

		server: webpack(
			require(path.resolve('webpack/server.config.js'))
		),

		serviceWorker: webpack(
			tryRequire(path.resolve('webpack/server.config.js'))
		)
	};
}

function tryRequire(specifier: string) {
	try {
		return require(specifier);
	} catch (err) {
		if (err.code === 'MODULE_NOT_FOUND') return null;
		throw err;
	}
}