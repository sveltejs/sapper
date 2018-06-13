'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var glob = require('glob');
var glob__default = _interopDefault(glob);
var __chunk_2 = require('./chunk-0b33a300.js');
var core_ts = require('./core.ts.js');
var __chunk_3 = require('./chunk-01d4fc8b.js');
var __chunk_5 = require('./chunk-7bbecb9e.js');
var __chunk_6 = require('./chunk-bdb8aeea.js');
require('path');
require('sander');
require('require-relative');
require('tslib');
require('fs');
require('http');
require('child_process');
require('port-authority');
require('mkdirp');
require('rimraf');
require('webpack-format-messages');
require('events');
require('./chunk-5c57bbb7.js');
require('html-minifier');
require('cheerio');
require('url-parse');
require('node-fetch');

function find_page(pathname, files) {
    if (files === void 0) { files = glob.sync('**/*.*', { cwd: __chunk_2.locations.routes(), dot: true, nodir: true }); }
    var routes = core_ts.create_routes({ files: files });
    for (var i = 0; i < routes.length; i += 1) {
        var route = routes[i];
        if (route.pattern.test(pathname)) {
            var page = route.handlers.find(function (handler) { return handler.type === 'page'; });
            if (page)
                return page.file;
        }
    }
}

exports.dev = __chunk_3.dev;
exports.build = __chunk_5.build;
exports.exporter = __chunk_6.exporter;
exports.find_page = find_page;
//# sourceMappingURL=api.ts.js.map
