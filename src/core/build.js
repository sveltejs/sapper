process.env.NODE_ENV = 'production';

import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import * as compilers from './utils/compilers.js';
import create_app from './utils/create_app.js';
import generate_asset_cache from './generate_asset_cache.js';

export default function build({ dest, dev, entry, src }) {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));

	// create main.js and server-routes.js
	create_app({ dev, entry, src });

	return new Promise((fulfil, reject) => {
		function handleErrors(err, stats) {
			if (err) {
				reject(err);
				process.exit(1);
			}

			if (stats.hasErrors()) {
				console.error(stats.toString({ colors: true }));
				reject(new Error(`Encountered errors while building app`));
			}
		}

		const { client, server } = compilers.get_compilers(); // TODO refactor

		client.run((err, client_stats) => {
			handleErrors(err, client_stats);
			const client_info = client_stats.toJson();
			fs.writeFileSync(path.join(dest, 'stats.client.json'), JSON.stringify(client_info, null, '  '));

			server.run((err, server_stats) => {
				handleErrors(err, server_stats);
				const server_info = server_stats.toJson();
				fs.writeFileSync(path.join(dest, 'stats.server.json'), JSON.stringify(server_info, null, '  '));

				generate_asset_cache({ src, dest, dev, client_info, server_info });
				fulfil();
			});
		});
	});
}
