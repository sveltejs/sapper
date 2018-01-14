process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const { client, server } = require('./utils/compilers.js');
const create_app = require('./utils/create_app.js');
const generate_asset_cache = require('./utils/generate_asset_cache.js');
const { dest } = require('./config.js');

module.exports = () => {
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
