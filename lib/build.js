const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { client, server } = require('./utils/compilers.js');
const create_app = require('./utils/create_app.js');
const { dest } = require('./config.js');

module.exports = () => {
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
		fs.writeFileSync(path.join(dest, 'stats.client.json'), JSON.stringify(clientStats.toJson(), null, '  '));

		server.run((err, serverStats) => {
			handleErrors(err, serverStats);
			fs.writeFileSync(path.join(dest, 'stats.server.json'), JSON.stringify(serverStats.toJson(), null, '  '));
		});
	});
};