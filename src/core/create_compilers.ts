import * as fs from 'fs';
import * as path from 'path';
import relative from 'require-relative';

let r: any;
let wp: any;

export class WebpackCompiler {
	_: any;

	constructor(config: any) {
		this._ = wp(require(path.resolve(config)));
	}

	oninvalid(cb: (filename: string) => void) {
		this._.hooks.invalid.tap('sapper', cb);
	}

	compile() {
		return new Promise((fulfil, reject) => {
			this._.run((err: Error, stats: any) => {
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

	watch(cb: (err: Error, stats: any) => void) {
		this._.watch({}, cb);
	}
}

export class RollupCompiler {
	constructor(config: any) {

	}

	oninvalid(cb: (filename: string) => void) {

	}

	compile() {
		return new Promise((fulfil, reject) => {

		});
	}

	watch(cb: (err: Error, stats: any) => void) {

	}
}

export type Compiler = RollupCompiler | WebpackCompiler;

export type Compilers = {
	client: Compiler;
	server: Compiler;
	serviceworker?: Compiler;
}

export default function create_compilers({ webpack, rollup }: { webpack: string, rollup: string }): Compilers {
	if (fs.existsSync(rollup)) {
		if (!r) r = relative('rollup', process.cwd());

		const sw = `${rollup}/service-worker.config.js`;

		return {
			client: new RollupCompiler(`${rollup}/client.config.js`),
			server: new RollupCompiler(`${rollup}/server.config.js`),
			serviceworker: fs.existsSync(sw) && new RollupCompiler(sw)
		};
	}

	if (fs.existsSync(webpack)) {
		if (!wp) wp = relative('webpack', process.cwd());

		const sw = `${webpack}/service-worker.config.js`;

		return {
			client: new WebpackCompiler(`${webpack}/client.config.js`),
			server: new WebpackCompiler(`${webpack}/server.config.js`),
			serviceworker: fs.existsSync(sw) && new WebpackCompiler(sw)
		};
	}

	throw new Error(`Could not find config files for rollup or webpack`);
}