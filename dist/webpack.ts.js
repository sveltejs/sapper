'use strict';

var __chunk_2 = require('./chunk-0b33a300.js');
require('path');

var webpack = {
    dev: __chunk_2.dev(),
    client: {
        entry: function () {
            return {
                main: __chunk_2.locations.app() + "/client"
            };
        },
        output: function () {
            return {
                path: __chunk_2.locations.dest() + "/client",
                filename: '[hash]/[name].js',
                chunkFilename: '[hash]/[name].[id].js',
                publicPath: "client/"
            };
        }
    },
    server: {
        entry: function () {
            return {
                server: __chunk_2.locations.app() + "/server"
            };
        },
        output: function () {
            return {
                path: __chunk_2.locations.dest(),
                filename: '[name].js',
                chunkFilename: '[hash]/[name].[id].js',
                libraryTarget: 'commonjs2'
            };
        }
    },
    serviceworker: {
        entry: function () {
            return {
                'service-worker': __chunk_2.locations.app() + "/service-worker"
            };
        },
        output: function () {
            return {
                path: __chunk_2.locations.dest(),
                filename: '[name].js',
                chunkFilename: '[name].[id].[hash].js'
            };
        }
    }
};

module.exports = webpack;
//# sourceMappingURL=webpack.ts.js.map
