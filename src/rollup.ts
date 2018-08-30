import { locations, dev } from './config';

export default {
	dev: dev(),

	client: {
		input: () => {
			return `${locations.app()}/client.js`
		},

		output: () => {
			return {
				dir: `${locations.dest()}/client`,
				entryFileNames: '[name].[hash].js',
				chunkFileNames: '[name].[hash].js',
				format: 'esm'
			};
		}
	},

	server: {
		input: () => {
			return `${locations.app()}/server.js`
		},

		output: () => {
			return {
				dir: locations.dest(),
				format: 'cjs'
			};
		}
	},

	serviceworker: {
		input: () => {
			return `${locations.app()}/service-worker.js`;
		},

		output: () => {
			return {
				file: `${locations.dest()}/service-worker.js`,
				format: 'iife'
			}
		}
	}
};