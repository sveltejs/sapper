import { dev, src, dest } from './env';

export default {
	dev,

	client: {
		input: () => {
			return `${src}/client.js`
		},

		output: () => {
			let dir = `${dest}/client`;
			if (process.env.SAPPER_LEGACY_BUILD) dir += `/legacy`;

			return {
				dir,
				entryFileNames: '[name].[hash].js',
				chunkFileNames: '[name].[hash].js',
				format: 'esm',
				sourcemap: dev
			};
		}
	},

	server: {
		input: () => {
			return {
				server: `${src}/server.js`
			};
		},

		output: () => {
			return {
				dir: `${dest}/server`,
				format: 'cjs',
				sourcemap: dev
			};
		}
	},

	serviceworker: {
		input: () => {
			return `${src}/service-worker.js`;
		},

		output: () => {
			return {
				file: `${dest}/service-worker.js`,
				format: 'iife'
			}
		}
	}
};