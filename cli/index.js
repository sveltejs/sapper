#!/usr/bin/env node

const cmd = process.argv[2];

if (cmd === 'build') {
	process.env.NODE_ENV = 'production';
	require('../lib/build.js')();
}