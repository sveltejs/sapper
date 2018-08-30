const config = require('../../../config/webpack.js');

module.exports = {
	entry: config.serviceworker.entry(),
	output: config.serviceworker.output(),
	mode: process.env.NODE_ENV
};