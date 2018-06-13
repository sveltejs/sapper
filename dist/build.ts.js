'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var __chunk_5 = require('./chunk-7bbecb9e.js');
var colors = require('ansi-colors');
var __chunk_2 = require('./chunk-0b33a300.js');
require('tslib');
require('fs');
require('path');
require('mkdirp');
require('rimraf');
require('events');
require('./chunk-5c57bbb7.js');
require('html-minifier');
require('./core.ts.js');
require('sander');
require('glob');
require('require-relative');

function build() {
    return new Promise(function (fulfil, reject) {
        try {
            var emitter = __chunk_5.build({
                dest: __chunk_2.locations.dest(),
                app: __chunk_2.locations.app(),
                routes: __chunk_2.locations.routes(),
                webpack: 'webpack'
            });
            emitter.on('build', function (event) {
                console.log(colors.inverse("\nbuilt " + event.type));
                console.log(event.webpack_stats.toString({ colors: true }));
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

exports.build = build;
//# sourceMappingURL=build.ts.js.map
