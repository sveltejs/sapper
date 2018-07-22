'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = require('path');
var colors = require('ansi-colors');
var child_process = require('child_process');
var prettyMs = _interopDefault(require('pretty-ms'));
var __chunk_3 = require('./chunk-01d4fc8b.js');
require('tslib');
require('fs');
require('http');
require('port-authority');
require('mkdirp');
require('rimraf');
require('webpack-format-messages');
require('./chunk-0b33a300.js');
require('events');
require('./core.ts.js');
require('sander');
require('glob');
require('require-relative');

function dev(opts) {
    try {
        var watcher = __chunk_3.dev(opts);
        var first_1 = true;
        watcher.on('ready', function (event) {
            if (first_1) {
                console.log("" + colors.bold.cyan("> Listening on http://localhost:" + event.port));
                if (opts.open)
                    child_process.exec("open http://localhost:" + event.port);
                first_1 = false;
            }
            // TODO clear screen?
            event.process.stdout.on('data', function (data) {
                process.stdout.write(data);
            });
            event.process.stderr.on('data', function (data) {
                process.stderr.write(data);
            });
        });
        watcher.on('invalid', function (event) {
            var changed = event.changed.map(function (filename) { return path.relative(process.cwd(), filename); }).join(', ');
            console.log("\n" + colors.bold.cyan(changed) + " changed. rebuilding...");
        });
        watcher.on('error', function (event) {
            console.log("" + colors.red("\u2717 " + event.type));
            console.log("" + colors.red(event.error.message));
        });
        watcher.on('fatal', function (event) {
            console.log("" + colors.bold.red("> " + event.error.message));
        });
        watcher.on('build', function (event) {
            if (event.errors.length) {
                console.log("" + colors.bold.red("\u2717 " + event.type));
                event.errors.filter(function (e) { return !e.duplicate; }).forEach(function (error) {
                    console.log(error.message);
                });
                var hidden = event.errors.filter(function (e) { return e.duplicate; }).length;
                if (hidden > 0) {
                    console.log(hidden + " duplicate " + (hidden === 1 ? 'error' : 'errors') + " hidden\n");
                }
            }
            else if (event.warnings.length) {
                console.log("" + colors.bold.yellow("\u2022 " + event.type));
                event.warnings.filter(function (e) { return !e.duplicate; }).forEach(function (warning) {
                    console.log(warning.message);
                });
                var hidden = event.warnings.filter(function (e) { return e.duplicate; }).length;
                if (hidden > 0) {
                    console.log(hidden + " duplicate " + (hidden === 1 ? 'warning' : 'warnings') + " hidden\n");
                }
            }
            else {
                console.log(colors.bold.green("\u2714 " + event.type) + " " + colors.gray("(" + prettyMs(event.duration) + ")"));
            }
        });
    }
    catch (err) {
        console.log("" + colors.bold.red("> " + err.message));
        process.exit(1);
    }
}

exports.dev = dev;
//# sourceMappingURL=dev.ts.js.map
