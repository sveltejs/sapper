import * as fs from 'fs';
import * as path from 'path';
import webpackConf from '../../config/webpack';

const DefaultPublicPath = webpackConf.client.output().publicPath;
const DefaultPrefix = '${req.baseUrl}';
const runtimes = [
	'server.mjs'
];
export function replaceAssetsPrefix(output: string, assetsPrefix: string) {
	// replace assets prefix in generated runtimes if webpack.config specified output.publicPath
	// use `req.baseUrl` by default
	runtimes.forEach((file) => {
		// because `client/` is common prefix but webpack.config.js output.publicPath must
		// have that, so let's remove it in generated runtimes
		const prefix = assetsPrefix !== DefaultPublicPath ?
			assetsPrefix.replace(/\/client\/?$/, '') :
			DefaultPrefix;
		const source = fs.readFileSync(path.join(__dirname, `../runtime/${file}`), 'utf-8');
		const replacedCode = source.replace(/%sapper.assetsPrefix%/g, prefix);
		fs.writeFileSync(`${output}/${file}`, replacedCode);
	});
}