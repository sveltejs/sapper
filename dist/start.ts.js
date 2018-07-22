'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib_1 = require('tslib');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var colors = require('ansi-colors');
var ports = require('port-authority');

function start(dir, opts) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var port, resolved, server;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    port = opts.port || +process.env.PORT;
                    resolved = path.resolve(dir);
                    server = path.resolve(dir, 'server.js');
                    if (!fs.existsSync(server)) {
                        console.log("" + colors.bold.red("> " + dir + "/server.js does not exist \u2014 type " + colors.bold.cyan(dir === 'build' ? "npx sapper build" : "npx sapper build " + dir) + " to create it"));
                        return [2 /*return*/];
                    }
                    if (!port) return [3 /*break*/, 2];
                    return [4 /*yield*/, ports.check(port)];
                case 1:
                    if (!(_a.sent())) {
                        console.log("" + colors.bold.red("> Port " + port + " is unavailable"));
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ports.find(3000)];
                case 3:
                    port = _a.sent();
                    _a.label = 4;
                case 4:
                    child_process.fork(server, [], {
                        cwd: process.cwd(),
                        env: Object.assign({
                            NODE_ENV: 'production',
                            PORT: port,
                            SAPPER_DEST: dir
                        }, process.env)
                    });
                    return [4 /*yield*/, ports.wait(port)];
                case 5:
                    _a.sent();
                    console.log("" + colors.bold.cyan("> Listening on http://localhost:" + port));
                    if (opts.open)
                        child_process.exec("open http://localhost:" + port);
                    return [2 /*return*/];
            }
        });
    });
}

exports.start = start;
//# sourceMappingURL=start.ts.js.map
