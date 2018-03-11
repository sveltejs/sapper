'use strict';

var __chunk1_js = require('./chunk1.js');

var webpack = {
    dev: __chunk1_js.dev(),
    client: {
        entry: function () {
            return {
                main: './app/client'
            };
        },
        output: function () {
            return {
                path: __chunk1_js.dest() + "/client",
                filename: '[hash]/[name].js',
                chunkFilename: '[hash]/[name].[id].js',
                publicPath: '/client/'
            };
        }
    },
    server: {
        entry: function () {
            return {
                server: './app/server'
            };
        },
        output: function () {
            return {
                path: __chunk1_js.dest(),
                filename: '[name].js',
                chunkFilename: '[hash]/[name].[id].js',
                libraryTarget: 'commonjs2'
            };
        }
    },
    serviceworker: {
        entry: function () {
            return {
                'service-worker': './app/service-worker'
            };
        },
        output: function () {
            return {
                path: __chunk1_js.dest(),
                filename: '[name].js',
                chunkFilename: '[name].[id].[hash].js'
            };
        }
    }
};

module.exports = webpack;
//# sourceMappingURL=./webpack.ts.js.map
