const config = require('../../../webpack/config.js');

module.exports = {
	entry: config.serviceworker.entry(),
	output: config.serviceworker.output(),
	mode: process.env.NODE_ENV
};