import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { create_compilers, create_app, create_routes, create_serviceworker } from 'sapper/core.js';

export default async function build({ src, dest, dev, entry }: {
	src: string;
	dest: string;
	dev: boolean;
	entry: { client: string, server: string }
}) {
	mkdirp.sync(dest);
	rimraf.sync(path.join(dest, '**/*'));

	const routes = create_routes({ src });

	// create app/manifest/client.js and app/manifest/server.js
	create_app({ routes, src, dev });

	const { client, server, serviceworker } = create_compilers();

	const client_stats = await compile(client);
	fs.writeFileSync(path.join(dest, 'client_info.json'), JSON.stringify(client_stats.toJson()));

	await compile(server);

	if (serviceworker) {
		create_serviceworker({
			routes,
			client_files: client_stats.toJson().assets.map((chunk: { name: string }) => `/client/${chunk.name}`),
			src
		});

		await compile(serviceworker);
	}
}

function compile(compiler: any) {
	return new Promise((fulfil, reject) => {
		compiler.run((err: Error, stats: any) => {
			if (err) {
				reject(err);
				process.exit(1);
			}

			if (stats.hasErrors()) {
				console.error(stats.toString({ colors: true }));
				reject(new Error(`Encountered errors while building app`));
			}

			else {
				fulfil(stats);
			}
		});
	});
}