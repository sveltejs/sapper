import { dev, src, dest } from './env';
import { InputOption, OutputOptions } from 'rollup';

const defaultSourcemap = dev ? 'inline' : false;

export default {
	dev,

	client: {
		input: (): InputOption => {
			return `${src}/client.js`
		},

		output: (sourcemap: boolean | 'inline' = defaultSourcemap): OutputOptions => {
			let dir = `${dest}/client`;
			if (process.env.SAPPER_LEGACY_BUILD) dir += `/legacy`;

			return {
				dir,
				entryFileNames: '[name].[hash].js',
				chunkFileNames: '[name].[hash].js',
				format: 'esm',
				sourcemap
			};
		}
	},

	server: {
		input: (): InputOption => {
			return {
				server: `${src}/server.js`
			};
		},

		output: (sourcemap: boolean | 'inline' = defaultSourcemap): OutputOptions => {
			return {
				dir: `${dest}/server`,
				format: 'cjs',
				sourcemap
			};
		}
	},

	serviceworker: {
		input: (): InputOption => {
			return `${src}/service-worker.js`;
		},

		output: (sourcemap: boolean | 'inline' = defaultSourcemap): OutputOptions => {
			return {
				file: `${dest}/service-worker.js`,
				format: 'iife',
				sourcemap
			}
		}
	}
};