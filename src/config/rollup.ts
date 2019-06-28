import { dev, src, dest } from './env';
import { InputOption, OutputOptions } from 'rollup'

const defaultSourcemap =
	dev === true ? 'inline' : false

export default {
	dev,

	client: {
		input: (): InputOption => {
			return `${src}/client.js`
		},

		output: (sourcemap?: boolean | 'inline'): OutputOptions => {
			let dir = `${dest}/client`;
			if (process.env.SAPPER_LEGACY_BUILD) dir += `/legacy`;

			return {
				dir,
				entryFileNames: '[name].[hash].js',
				chunkFileNames: '[name].[hash].js',
				format: 'esm',
				sourcemap: sourcemap !== undefined ? sourcemap : defaultSourcemap
			};
		}
	},

	server: {
		input: (): InputOption => {
			return {
				server: `${src}/server.js`
			};
		},

		output: (sourcemap?: boolean | 'inline'): OutputOptions => {
			return {
				dir: `${dest}/server`,
				format: 'cjs',
				sourcemap: sourcemap !== undefined ? sourcemap : defaultSourcemap
			};
		}
	},

	serviceworker: {
		input: (): InputOption => {
			return `${src}/service-worker.js`;
		},

		output: (sourcemap?: boolean | 'inline'): OutputOptions => {
			return {
				file: `${dest}/service-worker.js`,
				format: 'iife',
				sourcemap: sourcemap !== undefined ? sourcemap : defaultSourcemap
			}
		}
	}
};
