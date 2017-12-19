const fs = require('fs');
const path = require('path');
const glob = require('glob');
const mkdirp = require('mkdirp');
const { client, server } = require('./utils/compilers.js');
const create_app = require('./utils/create_app.js');
const generate_asset_cache = require('./utils/generate_asset_cache.js');
const { dest } = require('./config.js');

module.exports = () => {
	mkdirp(dest);

	// create main.js and server-routes.js
	create_app();

	function handleErrors(err, stats) {
		if (err) {
			console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
			process.exit(1);
		}

		if (stats.hasErrors()) {
			console.log(stats.toString({ colors: true }));
			process.exit(1);
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
		});
	});
};