'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib_1 = require('tslib');
var child_process = require('child_process');
var path = require('path');
var sander = require('sander');
var cheerio = _interopDefault(require('cheerio'));
var URL = _interopDefault(require('url-parse'));
var fetch = _interopDefault(require('node-fetch'));
var ports = require('port-authority');
var events = require('events');
var __chunk_4 = require('./chunk-5c57bbb7.js');

function exporter(opts) {
    var emitter = new events.EventEmitter();
    execute(emitter, opts).then(function () {
        emitter.emit('done', {}); // TODO do we need to pass back any info?
    }, function (error) {
        emitter.emit('error', {
            error: error
        });
    });
    return emitter;
}
function execute(emitter, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.build, build = _c === void 0 ? 'build' : _c, _d = _b.dest, dest = _d === void 0 ? 'export' : _d, _e = _b.basepath, basepath = _e === void 0 ? '' : _e;
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        function handle(url) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var r, range, body, $, urls_2, base_1, _i, urls_1, url_1;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch(url.href)];
                        case 1:
                            r = _a.sent();
                            range = ~~(r.status / 100);
                            if (range >= 4) {
                                emitter.emit('failure', {
                                    status: r.status,
                                    pathname: url.pathname
                                });
                                return [2 /*return*/];
                            }
                            if (!(range === 2)) return [3 /*break*/, 6];
                            if (!(r.headers.get('Content-Type') === 'text/html')) return [3 /*break*/, 6];
                            return [4 /*yield*/, r.text()];
                        case 2:
                            body = _a.sent();
                            $ = cheerio.load(body);
                            urls_2 = [];
                            base_1 = new URL($('base').attr('href') || '/', url.href);
                            $('a[href]').each(function (i, $a) {
                                var url = new URL($a.attribs.href, base_1.href);
                                if (url.origin === origin && !seen.has(url.pathname)) {
                                    seen.add(url.pathname);
                                    urls_2.push(url);
                                }
                            });
                            _i = 0, urls_1 = urls_2;
                            _a.label = 3;
                        case 3:
                            if (!(_i < urls_1.length)) return [3 /*break*/, 6];
                            url_1 = urls_1[_i];
                            return [4 /*yield*/, handle(url_1)];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        var export_dir, port, origin, proc, seen, saved;
        return tslib_1.__generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    export_dir = path.join(dest, basepath);
                    // Prep output directory
                    sander.rimrafSync(export_dir);
                    sander.copydirSync('assets').to(export_dir);
                    sander.copydirSync(build, 'client').to(export_dir, 'client');
                    if (sander.existsSync(build, 'service-worker.js')) {
                        sander.copyFileSync(build, 'service-worker.js').to(export_dir, 'service-worker.js');
                    }
                    if (sander.existsSync(build, 'service-worker.js.map')) {
                        sander.copyFileSync(build, 'service-worker.js.map').to(export_dir, 'service-worker.js.map');
                    }
                    return [4 /*yield*/, ports.find(3000)];
                case 1:
                    port = _f.sent();
                    origin = "http://localhost:" + port;
                    proc = child_process.fork(path.resolve(build + "/server.js"), [], {
                        cwd: process.cwd(),
                        env: Object.assign({
                            PORT: port,
                            NODE_ENV: 'production',
                            SAPPER_DEST: build,
                            SAPPER_EXPORT: 'true'
                        }, process.env)
                    });
                    seen = new Set();
                    saved = new Set();
                    proc.on('message', function (message) {
                        if (!message.__sapper__)
                            return;
                        var file = new URL(message.url, origin).pathname.slice(1);
                        var body = message.body;
                        if (saved.has(file))
                            return;
                        saved.add(file);
                        var is_html = message.type === 'text/html';
                        if (is_html) {
                            file = file === '' ? 'index.html' : file + "/index.html";
                            body = __chunk_4.minify_html(body);
                        }
                        emitter.emit('file', {
                            file: file,
                            size: body.length
                        });
                        sander.writeFileSync(export_dir, file, body);
                    });
                    return [2 /*return*/, ports.wait(port)
                            .then(function () { return handle(new URL("/" + basepath, origin)); }) // TODO all static routes
                            .then(function () { return proc.kill(); })];
            }
        });
    });
}

exports.exporter = exporter;
//# sourceMappingURL=chunk-bdb8aeea.js.map
