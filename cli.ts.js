'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib_1 = require('tslib');
var fs = require('fs');
var path = require('path');
var clorox = require('clorox');
var mkdirp = _interopDefault(require('mkdirp'));
var rimraf = _interopDefault(require('rimraf'));
var __core_ts_js = require('./core.ts.js');
var __chunk1_js = require('./chunk1.js');
var child_process = require('child_process');
var sander = require('sander');
var polka = _interopDefault(require('polka'));
var cheerio = _interopDefault(require('cheerio'));
var URL = _interopDefault(require('url-parse'));
var fetch = _interopDefault(require('node-fetch'));
var ports = require('port-authority');
var http = require('http');
var format_messages = _interopDefault(require('webpack-format-messages'));
var prettyMs = _interopDefault(require('pretty-ms'));
var sade = _interopDefault(require('sade'));

function build() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var output, routes, _a, client, server, serviceworker, client_stats, server_stats, serviceworker_stats;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    output = __chunk1_js.dest();
                    mkdirp.sync(output);
                    rimraf.sync(path.join(output, '**/*'));
                    routes = __core_ts_js.create_routes();
                    // create app/manifest/client.js and app/manifest/server.js
                    __core_ts_js.create_app({ routes: routes, src: __chunk1_js.src, dev: __chunk1_js.dev });
                    _a = __core_ts_js.create_compilers(), client = _a.client, server = _a.server, serviceworker = _a.serviceworker;
                    return [4 /*yield*/, compile(client)];
                case 1:
                    client_stats = _b.sent();
                    console.log(clorox.inverse("\nbuilt client"));
                    console.log(client_stats.toString({ colors: true }));
                    fs.writeFileSync(path.join(output, 'client_info.json'), JSON.stringify(client_stats.toJson()));
                    return [4 /*yield*/, compile(server)];
                case 2:
                    server_stats = _b.sent();
                    console.log(clorox.inverse("\nbuilt server"));
                    console.log(server_stats.toString({ colors: true }));
                    if (!serviceworker) return [3 /*break*/, 4];
                    __core_ts_js.create_serviceworker({
                        routes: routes,
                        client_files: client_stats.toJson().assets.map(function (chunk) { return "/client/" + chunk.name; }),
                        src: __chunk1_js.src
                    });
                    return [4 /*yield*/, compile(serviceworker)];
                case 3:
                    serviceworker_stats = _b.sent();
                    console.log(clorox.inverse("\nbuilt service worker"));
                    console.log(serviceworker_stats.toString({ colors: true }));
                    _b.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function compile(compiler) {
    return new Promise(function (fulfil, reject) {
        compiler.run(function (err, stats) {
            if (err) {
                reject(err);
                process.exit(1);
            }
            if (stats.hasErrors()) {
                console.error(stats.toString({ colors: true }));
                reject(new Error("Encountered errors while building app"));
            }
            else {
                fulfil(stats);
            }
        });
    });
}

var app = polka();
function exporter(export_dir) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        function handle(url) {
            if (url.origin !== origin)
                return;
            if (seen.has(url.pathname))
                return;
            seen.add(url.pathname);
            return fetch(url.href)
                .then(function (r) {
                if (r.headers.get('Content-Type') === 'text/html') {
                    return r.text().then(function (body) {
                        var $ = cheerio.load(body);
                        var hrefs = [];
                        $('a[href]').each(function (i, $a) {
                            hrefs.push($a.attribs.href);
                        });
                        return hrefs.reduce(function (promise, href) {
                            return promise.then(function () { return handle(new URL(href, url.href)); });
                        }, Promise.resolve());
                    });
                }
            })["catch"](function (err) {
                console.error("Error rendering " + url.pathname + ": " + err.message);
            });
        }
        var build_dir, port, origin, proc, seen, saved;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    build_dir = __chunk1_js.dest();
                    // Prep output directory
                    sander.rimrafSync(export_dir);
                    sander.copydirSync('assets').to(export_dir);
                    sander.copydirSync(build_dir, 'client').to(export_dir, 'client');
                    if (sander.existsSync(build_dir, 'service-worker.js')) {
                        sander.copyFileSync(build_dir, 'service-worker.js').to(export_dir, 'service-worker.js');
                    }
                    return [4 /*yield*/, ports.find(3000)];
                case 1:
                    port = _a.sent();
                    origin = "http://localhost:" + port;
                    proc = child_process.fork(path.resolve(build_dir + "/server.js"), [], {
                        cwd: process.cwd(),
                        env: {
                            PORT: port,
                            NODE_ENV: 'production',
                            SAPPER_DEST: build_dir,
                            SAPPER_EXPORT: 'true'
                        }
                    });
                    seen = new Set();
                    saved = new Set();
                    proc.on('message', function (message) {
                        if (!message.__sapper__)
                            return;
                        var url = new URL(message.url, origin);
                        if (saved.has(url.pathname))
                            return;
                        saved.add(url.pathname);
                        if (message.type === 'text/html') {
                            var file = export_dir + "/" + url.pathname + "/index.html";
                            sander.writeFileSync(file, message.body);
                        }
                        else {
                            var file = export_dir + "/" + url.pathname;
                            sander.writeFileSync(file, message.body);
                        }
                    });
                    return [2 /*return*/, ports.wait(port)
                            .then(function () { return handle(new URL(origin)); }) // TODO all static routes
                            .then(function () { return proc.kill(); })];
            }
        });
    });
}

function deferred() {
    var d = {};
    d.promise = new Promise(function (fulfil, reject) {
        d.fulfil = fulfil;
        d.reject = reject;
    });
    return d;
}
function create_hot_update_server(port, interval) {
    if (interval === void 0) { interval = 10000; }
    var clients = new Set();
    var server = http.createServer(function (req, res) {
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
        clients.add(res);
        req.on('close', function () {
            clients["delete"](res);
        });
    });
    server.listen(port);
    function send(data) {
        clients.forEach(function (client) {
            client.write("data: " + JSON.stringify(data) + "\n\n");
        });
    }
    setInterval(function () {
        send(null);
    }, interval);
    return { send: send };
}
function dev(port) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        function restart_build(filename) {
            if (restarting)
                return;
            restarting = true;
            build = {
                unique_warnings: new Set(),
                unique_errors: new Set()
            };
            process.nextTick(function () {
                restarting = false;
            });
            console.log("\n" + clorox.bold.cyan(path.relative(process.cwd(), filename)) + " changed. rebuilding...");
        }
        function watch(compiler, _a) {
            var name = _a.name, _b = _a.invalid, invalid = _b === void 0 ? noop : _b, _c = _a.error, error = _c === void 0 ? noop : _c, result = _a.result;
            compiler.hooks.invalid.tap('sapper', function (filename) {
                invalid(filename);
            });
            compiler.watch({}, function (err, stats) {
                if (err) {
                    console.error(clorox.red("\u2717 " + name));
                    console.error(clorox.red(err.message));
                    error(err);
                }
                else {
                    var messages = format_messages(stats);
                    var info = stats.toJson();
                    if (messages.errors.length > 0) {
                        console.log(clorox.bold.red("\u2717 " + name));
                        var filtered = messages.errors.filter(function (message) {
                            return !build.unique_errors.has(message);
                        });
                        filtered.forEach(function (message) {
                            build.unique_errors.add(message);
                            console.log(message);
                        });
                        var hidden = messages.errors.length - filtered.length;
                        if (hidden > 0) {
                            console.log(hidden + " duplicate " + (hidden === 1 ? 'error' : 'errors') + " hidden\n");
                        }
                    }
                    else {
                        if (messages.warnings.length > 0) {
                            console.log(clorox.bold.yellow("\u2022 " + name));
                            var filtered = messages.warnings.filter(function (message) {
                                return !build.unique_warnings.has(message);
                            });
                            filtered.forEach(function (message) {
                                build.unique_warnings.add(message);
                                console.log(message + "\n");
                            });
                            var hidden = messages.warnings.length - filtered.length;
                            if (hidden > 0) {
                                console.log(hidden + " duplicate " + (hidden === 1 ? 'warning' : 'warnings') + " hidden\n");
                            }
                        }
                        else {
                            console.log(clorox.bold.green("\u2714 " + name) + " " + clorox.gray("(" + prettyMs(info.time) + ")"));
                        }
                        result(info);
                    }
                }
            });
        }
        var dir, dev_port, routes, hot_update_server, proc, deferreds, restarting, build, compilers, watch_serviceworker;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.env.NODE_ENV = 'development';
                    dir = __chunk1_js.dest();
                    rimraf.sync(dir);
                    mkdirp.sync(dir);
                    return [4 /*yield*/, ports.find(10000)];
                case 1:
                    dev_port = _a.sent();
                    routes = __core_ts_js.create_routes();
                    __core_ts_js.create_app({ routes: routes, dev_port: dev_port });
                    hot_update_server = create_hot_update_server(dev_port);
                    watch_files('routes/**/*', ['add', 'unlink'], function () {
                        var routes = __core_ts_js.create_routes();
                        __core_ts_js.create_app({ routes: routes, dev_port: dev_port });
                    });
                    watch_files('app/template.html', ['change'], function () {
                        hot_update_server.send({
                            action: 'reload'
                        });
                    });
                    process.on('exit', function () {
                        // sometimes webpack crashes, so we need to kill our children
                        if (proc)
                            proc.kill();
                    });
                    deferreds = {
                        server: deferred(),
                        client: deferred()
                    };
                    restarting = false;
                    build = {
                        unique_warnings: new Set(),
                        unique_errors: new Set()
                    };
                    compilers = __core_ts_js.create_compilers();
                    watch(compilers.server, {
                        name: 'server',
                        invalid: function (filename) {
                            restart_build(filename);
                            // TODO print message
                            deferreds.server = deferred();
                        },
                        result: function (info) {
                            // TODO log compile errors/warnings
                            fs.writeFileSync(path.join(dir, 'server_info.json'), JSON.stringify(info, null, '  '));
                            deferreds.client.promise.then(function () {
                                function restart() {
                                    ports.wait(port).then(deferreds.server.fulfil);
                                }
                                if (proc) {
                                    proc.kill();
                                    proc.on('exit', restart);
                                }
                                else {
                                    restart();
                                }
                                proc = child_process.fork(dir + "/server.js", [], {
                                    cwd: process.cwd(),
                                    env: Object.assign({
                                        PORT: port
                                    }, process.env)
                                });
                            });
                        }
                    });
                    watch(compilers.client, {
                        name: 'client',
                        invalid: function (filename) {
                            restart_build(filename);
                            deferreds.client = deferred();
                            // TODO we should delete old assets. due to a webpack bug
                            // i don't even begin to comprehend, this is apparently
                            // quite difficult
                        },
                        result: function (info) {
                            fs.writeFileSync(path.join(dir, 'client_info.json'), JSON.stringify(info, null, '  '));
                            deferreds.client.fulfil();
                            var client_files = info.assets.map(function (chunk) { return "/client/" + chunk.name; });
                            deferreds.server.promise.then(function () {
                                hot_update_server.send({
                                    status: 'completed'
                                });
                            });
                            __core_ts_js.create_serviceworker({
                                routes: __core_ts_js.create_routes(),
                                client_files: client_files
                            });
                            watch_serviceworker();
                        }
                    });
                    watch_serviceworker = compilers.serviceworker
                        ? function () {
                            watch_serviceworker = noop;
                            watch(compilers.serviceworker, {
                                name: 'service worker',
                                result: function (info) {
                                    fs.writeFileSync(path.join(dir, 'serviceworker_info.json'), JSON.stringify(info, null, '  '));
                                }
                            });
                        }
                        : noop;
                    return [2 /*return*/];
            }
        });
    });
}
function noop() { }
function watch_files(pattern, events, callback) {
    var chokidar = require('chokidar');
    var watcher = chokidar.watch(pattern, {
        persistent: true,
        ignoreInitial: true
    });
    events.forEach(function (event) {
        watcher.on(event, callback);
    });
}

var version = "0.8.4";

var _this = undefined;
var prog = sade('sapper').version(version);
prog.command('dev')
    .describe('Start a development server')
    .option('-p, --port', 'Specify a port')
    .action(function (opts) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var port;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                port = opts.port || +process.env.PORT;
                if (!port) return [3 /*break*/, 2];
                return [4 /*yield*/, ports.check(port)];
            case 1:
                if (!(_a.sent())) {
                    console.log(clorox.bold.red("> Port " + port + " is unavailable"));
                    return [2 /*return*/];
                }
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, ports.find(3000)];
            case 3:
                port = _a.sent();
                _a.label = 4;
            case 4:
                dev(port);
                return [2 /*return*/];
        }
    });
}); });
prog.command('build [dest]')
    .describe('Create a production-ready version of your app')
    .action(function (dest) {
    if (dest === void 0) { dest = 'build'; }
    console.log("> Building...");
    process.env.NODE_ENV = 'production';
    process.env.SAPPER_DEST = dest;
    var start = Date.now();
    build()
        .then(function () {
        var elapsed = Date.now() - start;
        console.error("\n> Finished in " + prettyMs(elapsed) + ". Type " + clorox.bold.cyan(dest === 'build' ? 'npx sapper start' : "npx sapper start " + dest) + " to run the app.");
    })["catch"](function (err) {
        console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
    });
});
prog.command('start [dir]')
    .describe('Start your app')
    .option('-p, --port', 'Specify a port')
    .action(function (dir, opts) {
    if (dir === void 0) { dir = 'build'; }
    return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var port, resolved, server;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    port = opts.port || +process.env.PORT;
                    resolved = path.resolve(dir);
                    server = path.resolve(dir, 'server.js');
                    if (!fs.existsSync(server)) {
                        console.log(clorox.bold.red("> " + dir + "/server.js does not exist \u2014 type " + clorox.bold.cyan(dir === 'build' ? "npx sapper build" : "npx sapper build " + dir) + " to create it"));
                        return [2 /*return*/];
                    }
                    if (!port) return [3 /*break*/, 2];
                    return [4 /*yield*/, ports.check(port)];
                case 1:
                    if (!(_a.sent())) {
                        console.log(clorox.bold.red("> Port " + port + " is unavailable"));
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
                    return [2 /*return*/];
            }
        });
    });
});
prog.command('export [dest]')
    .describe('Export your app as static files (if possible)')
    .action(function (dest) {
    if (dest === void 0) { dest = 'export'; }
    console.log("> Building...");
    process.env.NODE_ENV = 'production';
    process.env.SAPPER_DEST = '.sapper/.export';
    var start = Date.now();
    build()
        .then(function () {
        var elapsed = Date.now() - start;
        console.error("\n> Built in " + prettyMs(elapsed) + ". Exporting...");
    })
        .then(function () { return exporter(dest); })
        .then(function () {
        var elapsed = Date.now() - start;
        console.error("\n> Finished in " + prettyMs(elapsed) + ". Type " + clorox.bold.cyan("npx serve " + dest) + " to run the app.");
    })["catch"](function (err) {
        console.error(err ? err.details || err.stack || err.message || err : 'Unknown error');
    });
});
// TODO upgrade
prog.parse(process.argv);
//# sourceMappingURL=./cli.ts.js.map
