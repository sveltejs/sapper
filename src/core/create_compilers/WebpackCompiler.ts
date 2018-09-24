import relative from 'require-relative';
import { CompileResult } from './interfaces';
import WebpackResult from './WebpackResult';

let webpack: any;

export class WebpackCompiler {
	_: any;

	constructor(config: any) {
		if (!webpack) webpack = relative('webpack', process.cwd());
		this._ = webpack(config);
	}

	oninvalid(cb: (filename: string) => void) {
		this._.hooks.invalid.tap('sapper', cb);
	}

	compile(): Promise<CompileResult> {
		return new Promise((fulfil, reject) => {
			this._.run((err: Error, stats: any) => {
				if (err) {
					reject(err);
					process.exit(1);
				}

				const result = new WebpackResult(stats);

				if (result.errors.length) {
					console.error(stats.toString({ colors: true }));
					reject(new Error(`Encountered errors while building app`));
				}

				else {
					fulfil(result);
				}
			});
		});
	}

	watch(cb: (err?: Error, stats?: any) => void) {
		this._.watch({}, (err?: Error, stats?: any) => {
			cb(err, stats && new WebpackResult(stats));
		});
	}
}