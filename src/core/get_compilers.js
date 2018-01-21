import * as path from 'path';
import relative from 'require-relative';

export default function get_compilers() {
	const webpack = relative('webpack', process.cwd());

	return {
		client: webpack(
			require(path.resolve('webpack.client.config.js'))
		),

		server: webpack(
			require(path.resolve('webpack.server.config.js'))
		)
	};
}