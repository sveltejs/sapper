console.error(`[DEPRECATION] As of Sapper 0.18, webpack config should be loaded from sapper/config/webpack.js`);
module.exports = require('./dist/webpack.js');