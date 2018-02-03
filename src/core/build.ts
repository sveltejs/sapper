import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import create_compilers from './create_compilers.js';
import create_app from './create_app.js';
import create_assets from './create_assets.js';

export default function build({
	src,
	dest,
	dev,
	entry
}: {
	src: string;
	dest: string;
	dev: boolean;
	entry: { client: string, server: string }
}) {
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

		const { client, server } = create_compilers();

		client.run((err, client_stats) => {
			handleErrors(err, client_stats);
			const client_info = client_stats.toJson();
			fs.writeFileSync(
				path.join(dest, 'stats.client.json'),
				JSON.stringify(client_info, null, '  ')
			);

			server.run((err, server_stats) => {
				handleErrors(err, server_stats);
				const server_info = server_stats.toJson();
				fs.writeFileSync(
					path.join(dest, 'stats.server.json'),
					JSON.stringify(server_info, null, '  ')
				);

				create_assets({ src, dest, dev, client_info, server_info });
				fulfil();
			});
		});
	});
}
