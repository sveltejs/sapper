import { locations, dev } from './config';

export default {
	dev: dev(),

	client: {
		input: () => {
			return `${locations.src()}/client.js`
		},

		output: () => {
			let dir = `${locations.dest()}/client`;
			if (process.env.SAPPER_LEGACY_BUILD) dir += `/legacy`;

			return {
				dir,
				entryFileNames: '[name].[hash].js',
				chunkFileNames: '[name].[hash].js',
				format: 'esm',
				sourcemap: dev()
			};
		}
	},

	server: {
		input: () => {
			return `${locations.src()}/server.js`
		},

		output: () => {
			return {
				dir: locations.dest(),
				format: 'cjs',
				sourcemap: dev()
			};
		}
	},

	serviceworker: {
		input: () => {
			return `${locations.src()}/service-worker.js`;
		},

		output: () => {
			return {
				file: `${locations.dest()}/service-worker.js`,
				format: 'iife'
			}
		}
	}
};