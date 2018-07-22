'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib_1 = require('tslib');
var fs = require('fs');
var path = require('path');
var mkdirp = _interopDefault(require('mkdirp'));
var rimraf = _interopDefault(require('rimraf'));
var events = require('events');
var __chunk_4 = require('./chunk-5c57bbb7.js');
var core_ts = require('./core.ts.js');

function build(opts) {
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
    var _b = _a === void 0 ? {} : _a, _c = _b.dest, dest = _c === void 0 ? 'build' : _c, _d = _b.app, app = _d === void 0 ? 'app' : _d, _e = _b.webpack, webpack = _e === void 0 ? 'webpack' : _e, _f = _b.routes;
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var template, error, route_objects, _g, client, server, serviceworker, client_stats, client_info, server_stats, serviceworker_stats;
        return tslib_1.__generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    mkdirp.sync(dest);
                    rimraf.sync(path.join(dest, '**/*'));
                    template = fs.readFileSync(app + "/template.html", 'utf-8');
                    // remove this in a future version
                    if (template.indexOf('%sapper.base%') === -1) {
                        error = new Error("As of Sapper v0.10, your template.html file must include %sapper.base% in the <head>");
                        error.code = "missing-sapper-base";
                        throw error;
                    }
                    fs.writeFileSync(dest + "/template.html", __chunk_4.minify_html(template));
                    route_objects = core_ts.create_routes();
                    // create app/manifest/client.js and app/manifest/server.js
                    core_ts.create_main_manifests({ routes: route_objects });
                    _g = core_ts.create_compilers({ webpack: webpack }), client = _g.client, server = _g.server, serviceworker = _g.serviceworker;
                    return [4 /*yield*/, compile(client)];
                case 1:
                    client_stats = _h.sent();
                    emitter.emit('build', {
                        type: 'client',
                        // TODO duration/warnings
                        webpack_stats: client_stats
                    });
                    client_info = client_stats.toJson();
                    fs.writeFileSync(path.join(dest, 'client_info.json'), JSON.stringify(client_info));
                    fs.writeFileSync(path.join(dest, 'client_assets.json'), JSON.stringify(client_info.assetsByChunkName));
                    return [4 /*yield*/, compile(server)];
                case 2:
                    server_stats = _h.sent();
                    emitter.emit('build', {
                        type: 'server',
                        // TODO duration/warnings
                        webpack_stats: server_stats
                    });
                    if (!serviceworker) return [3 /*break*/, 4];
                    core_ts.create_serviceworker_manifest({
                        routes: route_objects,
                        client_files: client_stats.toJson().assets.map(function (chunk) { return "client/" + chunk.name; })
                    });
                    return [4 /*yield*/, compile(serviceworker)];
                case 3:
                    serviceworker_stats = _h.sent();
                    emitter.emit('build', {
                        type: 'serviceworker',
                        // TODO duration/warnings
                        webpack_stats: serviceworker_stats
                    });
                    _h.label = 4;
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

exports.build = build;
//# sourceMappingURL=chunk-7bbecb9e.js.map
