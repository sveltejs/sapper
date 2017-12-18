module.exports = function generate_asset_cache(clientInfo, serverInfo) {
	const main_file = `/client/${clientInfo.assetsByChunkName.main}`;
	const asset_files = clientInfo.assets.map(asset => `/client/${asset.name}`);

	return {
		client: {
			main_file,
			asset_files,

			main: read(main_file),
			assets: asset_files.reduce((lookup, file) => {
				lookup[file] = read(file);
				return lookup;
			}, {})
		}
	};

	compiler.client_main = `/client/${info.assetsByChunkName.main}`;
	compiler.assets = info.assets.map(asset => `/client/${asset.name}`);

	const _fs = client.outputFileSystem && client.outputFileSystem.readFileSync ? client.outputFileSystem : fs;
	compiler.asset_cache = {};
	compiler.assets.forEach(file => {
		compiler.asset_cache[file] = _fs.readFileSync(path.join(dest, file), 'utf-8');
	});
};