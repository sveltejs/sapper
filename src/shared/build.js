process.env.NODE_ENV = 'production';

import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { client, server } from './utils/compilers.js';
import create_app from './utils/create_app.js';
import generate_asset_cache from './generate_asset_cache.js';
import { dest } from '../config.js';

export default () => {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));

	// create main.js and server-routes.js
	create_app();

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

		client.run((err, clientStats) => {
			handleErrors(err, clientStats);
			const clientInfo = clientStats.toJson();
			fs.writeFileSync(path.join(dest, 'stats.client.json'), JSON.stringify(clientInfo, null, '  '));

			server.run((err, serverStats) => {
				handleErrors(err, serverStats);
				const serverInfo = serverStats.toJson();
				fs.writeFileSync(path.join(dest, 'stats.server.json'), JSON.stringify(serverInfo, null, '  '));

				generate_asset_cache(clientInfo, serverInfo);
				fulfil();
			});
		});
	});
};
