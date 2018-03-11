'use strict';

var path = require('path');

var dev = function () { return process.env.NODE_ENV !== 'production'; };
var src = function () { return path.resolve(process.env.SAPPER_ROUTES || 'routes'); };
var dest = function () { return path.resolve(process.env.SAPPER_DEST || '.sapper'); };

exports.dev = dev;
exports.src = src;
exports.dest = dest;
//# sourceMappingURL=./chunk1.js.map
