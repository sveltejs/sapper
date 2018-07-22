'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib_1 = require('tslib');
var path = require('path');
var fs = require('fs');
var http = require('http');
var child_process = require('child_process');
var ports = require('port-authority');
var mkdirp = _interopDefault(require('mkdirp'));
var rimraf = _interopDefault(require('rimraf'));
var format_messages = _interopDefault(require('webpack-format-messages'));
var __chunk_2 = require('./chunk-0b33a300.js');
var events = require('events');
var core_ts = require('./core.ts.js');

function dev(opts) {
    return new Watcher(opts);
}
var Watcher = /** @class */ (function (_super) {
    tslib_1.__extends(Watcher, _super);
    function Watcher(_a) {
        var _b = _a.app, app = _b === void 0 ? __chunk_2.locations.app() : _b, _c = _a.dest, dest = _c === void 0 ? __chunk_2.locations.dest() : _c, _d = _a.routes, routes = _d === void 0 ? __chunk_2.locations.routes() : _d, _e = _a.webpack, webpack = _e === void 0 ? 'webpack' : _e, _f = _a.port, port = _f === void 0 ? +process.env.PORT : _f;
        var _this = _super.call(this) || this;
        _this.dirs = { app: app, dest: dest, routes: routes, webpack: webpack };
        _this.port = port;
        _this.closed = false;
        _this.filewatchers = [];
        _this.current_build = {
            changed: new Set(),
            rebuilding: new Set(),
            unique_errors: new Set(),
            unique_warnings: new Set()
        };
        // remove this in a future version
        var template = fs.readFileSync(path.join(app, 'template.html'), 'utf-8');
        if (template.indexOf('%sapper.base%') === -1) {
            var error = new Error("As of Sapper v0.10, your template.html file must include %sapper.base% in the <head>");
            error.code = "missing-sapper-base";
            throw error;
        }
        process.env.NODE_ENV = 'development';
        process.on('exit', function () {
            _this.close();
        });
        _this.init();
        return _this;
    }
    Watcher.prototype.init = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, dest, dev_port, routes, compilers, watch_serviceworker;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.port) return [3 /*break*/, 2];
                        return [4 /*yield*/, ports.check(this.port)];
                    case 1:
                        if (!(_b.sent())) {
                            this.emit('fatal', {
                                error: new Error("Port " + this.port + " is unavailable")
                            });
                            return [2 /*return*/];
                        }
                        return [3 /*break*/, 4];
                    case 2:
                        _a = this;
                        return [4 /*yield*/, ports.find(3000)];
                    case 3:
                        _a.port = _b.sent();
                        _b.label = 4;
                    case 4:
                        dest = this.dirs.dest;
                        rimraf.sync(dest);
                        mkdirp.sync(dest);
                        return [4 /*yield*/, ports.find(10000)];
                    case 5:
                        dev_port = _b.sent();
                        routes = core_ts.create_routes();
                        core_ts.create_main_manifests({ routes: routes, dev_port: dev_port });
                        this.dev_server = new DevServer(dev_port);
                        this.filewatchers.push(watch_files(__chunk_2.locations.routes(), ['add', 'unlink'], function () {
                            var routes = core_ts.create_routes();
                            core_ts.create_main_manifests({ routes: routes, dev_port: dev_port });
                        }), watch_files(__chunk_2.locations.app() + "/template.html", ['change'], function () {
                            _this.dev_server.send({
                                action: 'reload'
                            });
                        }));
                        this.deferreds = {
                            server: new Deferred(),
                            client: new Deferred()
                        };
                        compilers = core_ts.create_compilers({ webpack: this.dirs.webpack });
                        this.watch(compilers.server, {
                            name: 'server',
                            invalid: function (filename) {
                                _this.restart(filename, 'server');
                                _this.deferreds.server = new Deferred();
                            },
                            result: function (info) {
                                fs.writeFileSync(path.join(dest, 'server_info.json'), JSON.stringify(info, null, '  '));
                                _this.deferreds.client.promise.then(function () {
                                    _this.dev_server.send({
                                        status: 'completed'
                                    });
                                    var restart = function () {
                                        ports.wait(_this.port).then((function () {
                                            _this.emit('ready', {
                                                port: _this.port,
                                                process: _this.proc
                                            });
                                            _this.deferreds.server.fulfil();
                                        }));
                                    };
                                    if (_this.proc) {
                                        _this.proc.kill();
                                        _this.proc.on('exit', restart);
                                    }
                                    else {
                                        restart();
                                    }
                                    _this.proc = child_process.fork(dest + "/server.js", [], {
                                        cwd: process.cwd(),
                                        env: Object.assign({
                                            PORT: _this.port
                                        }, process.env),
                                        stdio: ['ipc']
                                    });
                                });
                            }
                        });
                        this.watch(compilers.client, {
                            name: 'client',
                            invalid: function (filename) {
                                _this.restart(filename, 'client');
                                _this.deferreds.client = new Deferred();
                                // TODO we should delete old assets. due to a webpack bug
                                // i don't even begin to comprehend, this is apparently
                                // quite difficult
                            },
                            result: function (info) {
                                fs.writeFileSync(path.join(dest, 'client_info.json'), JSON.stringify(info));
                                fs.writeFileSync(path.join(dest, 'client_assets.json'), JSON.stringify(info.assetsByChunkName, null, '  '));
                                _this.deferreds.client.fulfil();
                                var client_files = info.assets.map(function (chunk) { return "client/" + chunk.name; });
                                core_ts.create_serviceworker_manifest({
                                    routes: core_ts.create_routes(),
                                    client_files: client_files
                                });
                                // we need to wait a beat before watching the service
                                // worker, because of some webpack nonsense
                                setTimeout(watch_serviceworker, 100);
                            }
                        });
                        watch_serviceworker = compilers.serviceworker
                            ? function () {
                                watch_serviceworker = noop;
                                _this.watch(compilers.serviceworker, {
                                    name: 'service worker',
                                    result: function (info) {
                                        fs.writeFileSync(path.join(dest, 'serviceworker_info.json'), JSON.stringify(info, null, '  '));
                                    }
                                });
                            }
                            : noop;
                        return [2 /*return*/];
                }
            });
        });
    };
    Watcher.prototype.close = function () {
        if (this.closed)
            return;
        this.closed = true;
        this.dev_server.close();
        if (this.proc)
            this.proc.kill();
        this.filewatchers.forEach(function (watcher) {
            watcher.close();
        });
    };
    Watcher.prototype.restart = function (filename, type) {
        var _this = this;
        if (this.restarting) {
            this.current_build.changed.add(filename);
            this.current_build.rebuilding.add(type);
        }
        else {
            this.restarting = true;
            this.current_build = {
                changed: new Set(),
                rebuilding: new Set(),
                unique_warnings: new Set(),
                unique_errors: new Set()
            };
            process.nextTick(function () {
                _this.emit('invalid', {
                    changed: Array.from(_this.current_build.changed),
                    invalid: {
                        server: _this.current_build.rebuilding.has('server'),
                        client: _this.current_build.rebuilding.has('client'),
                        serviceworker: _this.current_build.rebuilding.has('serviceworker')
                    }
                });
                _this.restarting = false;
            });
        }
    };
    Watcher.prototype.watch = function (compiler, _a) {
        var _this = this;
        var name = _a.name, _b = _a.invalid, invalid = _b === void 0 ? noop : _b, result = _a.result;
        compiler.hooks.invalid.tap('sapper', function (filename) {
            invalid(filename);
        });
        compiler.watch({}, function (err, stats) {
            if (err) {
                _this.emit('error', {
                    type: name,
                    error: err
                });
            }
            else {
                var messages = format_messages(stats);
                var info = stats.toJson();
                _this.emit('build', {
                    type: name,
                    duration: info.time,
                    errors: messages.errors.map(function (message) {
                        var duplicate = _this.current_build.unique_errors.has(message);
                        _this.current_build.unique_errors.add(message);
                        return mungeWebpackError(message, duplicate);
                    }),
                    warnings: messages.warnings.map(function (message) {
                        var duplicate = _this.current_build.unique_warnings.has(message);
                        _this.current_build.unique_warnings.add(message);
                        return mungeWebpackError(message, duplicate);
                    })
                });
                result(info);
            }
        });
    };
    return Watcher;
}(events.EventEmitter));
var locPattern = /\((\d+):(\d+)\)$/;
function mungeWebpackError(message, duplicate) {
    // TODO this is all a bit rube goldberg...
    var lines = message.split('\n');
    var file = lines.shift()
        .replace('[7m', '') // careful — there is a special character at the beginning of this string
        .replace('[27m', '')
        .replace('./', '');
    var line = null;
    var column = null;
    var match = locPattern.exec(lines[0]);
    if (match) {
        lines[0] = lines[0].replace(locPattern, '');
        line = +match[1];
        column = +match[2];
    }
    return {
        file: file,
        line: line,
        column: column,
        message: lines.join('\n'),
        originalMessage: message,
        duplicate: duplicate
    };
}
var Deferred = /** @class */ (function () {
    function Deferred() {
        var _this = this;
        this.promise = new Promise(function (fulfil, reject) {
            _this.fulfil = fulfil;
            _this.reject = reject;
        });
    }
    return Deferred;
}());
var INTERVAL = 10000;
var DevServer = /** @class */ (function () {
    function DevServer(port, interval) {
        if (interval === void 0) { interval = 10000; }
        var _this = this;
        this.clients = new Set();
        this._ = http.createServer(function (req, res) {
            if (req.url !== '/__sapper__')
                return;
            req.socket.setKeepAlive(true);
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control',
                'Content-Type': 'text/event-stream;charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                // While behind nginx, event stream should not be buffered:
                // http://nginx.org/docs/http/ngx_http_proxy_module.html#proxy_buffering
                'X-Accel-Buffering': 'no'
            });
            res.write('\n');
            _this.clients.add(res);
            req.on('close', function () {
                _this.clients["delete"](res);
            });
        });
        this._.listen(port);
        this.interval = setInterval(function () {
            _this.send(null);
        }, INTERVAL);
    }
    DevServer.prototype.close = function () {
        this._.close();
        clearInterval(this.interval);
    };
    DevServer.prototype.send = function (data) {
        this.clients.forEach(function (client) {
            client.write("data: " + JSON.stringify(data) + "\n\n");
        });
    };
    return DevServer;
}());
function noop() { }
function watch_files(pattern, events$$1, callback) {
    var chokidar = require('chokidar');
    var watcher = chokidar.watch(pattern, {
        persistent: true,
        ignoreInitial: true,
        disableGlobbing: true
    });
    events$$1.forEach(function (event) {
        watcher.on(event, callback);
    });
    return {
        close: function () { return watcher.close(); }
    };
}

exports.dev = dev;
//# sourceMappingURL=chunk-01d4fc8b.js.map
