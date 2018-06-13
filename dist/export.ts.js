'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_6 = require('./chunk-bdb8aeea.js');
var colors = require('ansi-colors');
var prettyBytes = _interopDefault(require('pretty-bytes'));
var __chunk_2 = require('./chunk-0b33a300.js');
require('tslib');
require('child_process');
require('path');
require('sander');
require('cheerio');
require('url-parse');
require('node-fetch');
require('port-authority');
require('events');
require('./chunk-5c57bbb7.js');
require('html-minifier');

function exporter(export_dir, _a) {
    var _b = _a.basepath, basepath = _b === void 0 ? '' : _b;
    return new Promise(function (fulfil, reject) {
        try {
            var emitter = __chunk_6.exporter({
                build: __chunk_2.locations.dest(),
                dest: export_dir,
                basepath: basepath
            });
            emitter.on('file', function (event) {
                console.log(colors.bold.cyan(event.file) + " " + colors.gray("(" + prettyBytes(event.size) + ")"));
            });
            emitter.on('failure', function (event) {
                console.log("" + colors.red("> Received " + event.status + " response when fetching " + event.pathname));
            });
            emitter.on('error', function (event) {
                reject(event.error);
            });
            emitter.on('done', function (event) {
                fulfil();
            });
        }
        catch (err) {
            console.log("" + colors.bold.red("> " + err.message));
            process.exit(1);
        }
    });
}

exports.exporter = exporter;
//# sourceMappingURL=export.ts.js.map
