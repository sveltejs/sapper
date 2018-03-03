/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules, executeModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [], result;
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules, executeModules);
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 	};
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// objects to store loaded and loading chunks
/******/ 	var installedChunks = {
/******/ 		11: 0
/******/ 	};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId) {
/******/ 		var installedChunkData = installedChunks[chunkId];
/******/ 		if(installedChunkData === 0) {
/******/ 			return new Promise(function(resolve) { resolve(); });
/******/ 		}
/******/
/******/ 		// a Promise means "currently loading".
/******/ 		if(installedChunkData) {
/******/ 			return installedChunkData[2];
/******/ 		}
/******/
/******/ 		// setup Promise in chunk cache
/******/ 		var promise = new Promise(function(resolve, reject) {
/******/ 			installedChunkData = installedChunks[chunkId] = [resolve, reject];
/******/ 		});
/******/ 		installedChunkData[2] = promise;
/******/
/******/ 		// start chunk loading
/******/ 		var head = document.getElementsByTagName('head')[0];
/******/ 		var script = document.createElement('script');
/******/ 		script.type = 'text/javascript';
/******/ 		script.charset = 'utf-8';
/******/ 		script.async = true;
/******/ 		script.timeout = 120000;
/******/
/******/ 		if (__webpack_require__.nc) {
/******/ 			script.setAttribute("nonce", __webpack_require__.nc);
/******/ 		}
/******/ 		script.src = __webpack_require__.p + "" + "48bd936692082e9009f3" + "/" + ({"0":"_","1":"blog","2":"blog_$slug$","3":"about","4":"_5xx","5":"_4xx","6":"slow_preload","7":"show_url","8":"redirect_to","9":"redirect_from","10":"delete_test"}[chunkId]||chunkId) + "." + chunkId + ".js";
/******/ 		var timeout = setTimeout(onScriptComplete, 120000);
/******/ 		script.onerror = script.onload = onScriptComplete;
/******/ 		function onScriptComplete() {
/******/ 			// avoid mem leaks in IE.
/******/ 			script.onerror = script.onload = null;
/******/ 			clearTimeout(timeout);
/******/ 			var chunk = installedChunks[chunkId];
/******/ 			if(chunk !== 0) {
/******/ 				if(chunk) {
/******/ 					chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
/******/ 				}
/******/ 				installedChunks[chunkId] = undefined;
/******/ 			}
/******/ 		};
/******/ 		head.appendChild(script);
/******/
/******/ 		return promise;
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/client/";
/******/
/******/ 	// on error function for async loading
/******/ 	__webpack_require__.oe = function(err) { console.error(err); throw err; };
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export component */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return prefetch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return init; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return goto; });
function detach(node) {
    node.parentNode.removeChild(node);
}
function findAnchor(node) {
    while (node && node.nodeName.toUpperCase() !== 'A')
        node = node.parentNode; // SVG <a> elements have a lowercase name
    return node;
}
function which(event) {
    return event.which === null ? event.button : event.which;
}
function scroll_state() {
    return {
        x: window.scrollX,
        y: window.scrollY
    };
}

var component;
var target;
var routes;
var errors;
var history = typeof window !== 'undefined' ? window.history : {
    pushState: function (state, title, href) { },
    replaceState: function (state, title, href) { },
    scrollRestoration: ''
};
var scroll_history = {};
var uid = 1;
var cid;
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
function select_route(url) {
    if (url.origin !== window.location.origin)
        return null;
    var _loop_1 = function (route) {
        var match = route.pattern.exec(url.pathname);
        if (match) {
            if (route.ignore)
                return { value: null };
            var params = route.params(match);
            var query_1 = {};
            if (url.search.length > 0) {
                url.search.slice(1).split('&').forEach(function (searchParam) {
                    var _a = /([^=]+)=(.*)/.exec(searchParam), key = _a[1], value = _a[2];
                    query_1[key] = value || true;
                });
            }
            return { value: { url: url, route: route, data: { params: params, query: query_1 } } };
        }
    };
    for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
        var route = routes_1[_i];
        var state_1 = _loop_1(route);
        if (typeof state_1 === "object")
            return state_1.value;
    }
}
var current_token;
function render(Component, data, scroll, token) {
    if (current_token !== token)
        return;
    if (component) {
        component.destroy();
    }
    else {
        // first load — remove SSR'd <head> contents
        var start = document.querySelector('#sapper-head-start');
        var end = document.querySelector('#sapper-head-end');
        if (start && end) {
            while (start.nextSibling !== end)
                detach(start.nextSibling);
            detach(start);
            detach(end);
        }
        // preload additional routes
        routes.reduce(function (promise, route) { return promise.then(route.load); }, Promise.resolve());
    }
    component = new Component({
        target: target,
        data: data,
        hydrate: !component
    });
    if (scroll) {
        window.scrollTo(scroll.x, scroll.y);
    }
}
function prepare_route(Component, data) {
    var redirect = null;
    var error = null;
    if (!Component.preload) {
        return { Component: Component, data: data, redirect: redirect, error: error };
    }
    if (!component && window.__SAPPER__ && window.__SAPPER__.preloaded) {
        return { Component: Component, data: Object.assign(data, window.__SAPPER__.preloaded), redirect: redirect, error: error };
    }
    return Promise.resolve(Component.preload.call({
        redirect: function (statusCode, location) {
            redirect = { statusCode: statusCode, location: location };
        },
        error: function (statusCode, message) {
            error = { statusCode: statusCode, message: message };
        }
    }, data))["catch"](function (err) {
        error = { statusCode: 500, message: err };
    }).then(function (preloaded) {
        if (error) {
            var route = error.statusCode >= 400 && error.statusCode < 500
                ? errors['4xx']
                : errors['5xx'];
            return route.load().then(function (_a) {
                var Component = _a["default"];
                var err = error.message instanceof Error ? error.message : new Error(error.message);
                Object.assign(data, { status: error.statusCode, error: err });
                return { Component: Component, data: data, redirect: null };
            });
        }
        Object.assign(data, preloaded);
        return { Component: Component, data: data, redirect: redirect };
    });
}
function navigate(target, id) {
    if (id) {
        // popstate or initial navigation
        cid = id;
    }
    else {
        // clicked on a link. preserve scroll state
        scroll_history[cid] = scroll_state();
        id = cid = ++uid;
        scroll_history[cid] = { x: 0, y: 0 };
    }
    cid = id;
    var loaded = prefetching && prefetching.href === target.url.href ?
        prefetching.promise :
        target.route.load().then(function (mod) { return prepare_route(mod["default"], target.data); });
    prefetching = null;
    var token = current_token = {};
    return loaded.then(function (_a) {
        var Component = _a.Component, data = _a.data, redirect = _a.redirect;
        if (redirect) {
            return goto(redirect.location, { replaceState: true });
        }
        render(Component, data, scroll_history[id], token);
    });
}
function handle_click(event) {
    // Adapted from https://github.com/visionmedia/page.js
    // MIT license https://github.com/visionmedia/page.js#license
    if (which(event) !== 1)
        return;
    if (event.metaKey || event.ctrlKey || event.shiftKey)
        return;
    if (event.defaultPrevented)
        return;
    var a = findAnchor(event.target);
    if (!a)
        return;
    // check if link is inside an svg
    // in this case, both href and target are always inside an object
    var svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
    var href = String(svg ? a.href.baseVal : a.href);
    if (href === window.location.href) {
        event.preventDefault();
        return;
    }
    // Ignore if tag has
    // 1. 'download' attribute
    // 2. rel='external' attribute
    if (a.hasAttribute('download') || a.getAttribute('rel') === 'external')
        return;
    // Ignore if <a> has a target
    if (svg ? a.target.baseVal : a.target)
        return;
    var url = new URL(href);
    // Don't handle hash changes
    if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
    var target = select_route(url);
    if (target) {
        navigate(target, null);
        event.preventDefault();
        history.pushState({ id: cid }, '', url.href);
    }
}
function handle_popstate(event) {
    scroll_history[cid] = scroll_state();
    if (event.state) {
        var url = new URL(window.location.href);
        var target_1 = select_route(url);
        navigate(target_1, event.state.id);
    }
    else {
        // hashchange
        cid = ++uid;
        history.replaceState({ id: cid }, '', window.location.href);
    }
}
var prefetching = null;
function prefetch(href) {
    var selected = select_route(new URL(href));
    if (selected) {
        prefetching = {
            href: href,
            promise: selected.route.load().then(function (mod) { return prepare_route(mod["default"], selected.data); })
        };
    }
}
function handle_touchstart_mouseover(event) {
    var a = findAnchor(event.target);
    if (!a || a.rel !== 'prefetch')
        return;
    prefetch(a.href);
}
var inited;
function init(_target, _routes) {
    target = _target;
    routes = _routes.filter(function (r) { return !r.error; });
    errors = {
        '4xx': _routes.find(function (r) { return r.error === '4xx'; }),
        '5xx': _routes.find(function (r) { return r.error === '5xx'; })
    };
    if (!inited) {
        window.addEventListener('click', handle_click);
        window.addEventListener('popstate', handle_popstate);
        // prefetch
        window.addEventListener('touchstart', handle_touchstart_mouseover);
        window.addEventListener('mouseover', handle_touchstart_mouseover);
        inited = true;
    }
    return Promise.resolve().then(function () {
        var _a = window.location, hash = _a.hash, href = _a.href;
        var deep_linked = hash && document.getElementById(hash.slice(1));
        scroll_history[uid] = deep_linked ?
            { x: 0, y: deep_linked.getBoundingClientRect().top } :
            scroll_state();
        history.replaceState({ id: uid }, '', href);
        var target = select_route(new URL(window.location.href));
        return navigate(target, uid);
    });
}
function goto(href, opts) {
    if (opts === void 0) { opts = { replaceState: false }; }
    var target = select_route(new URL(href, window.location.href));
    if (target) {
        navigate(target, null);
        if (history)
            history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
    }
    else {
        window.location.href = href;
    }
}


//# sourceMappingURL=runtime.js.map


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// EXTERNAL MODULE: /Users/208311/Development/SVELTE/sapper/runtime.js
var runtime = __webpack_require__(0);

// CONCATENATED MODULE: ./app/manifest/client.js
// This file is generated by Sapper — do not edit it!
const routes = [
	{ pattern: /^\/?$/, params: () => ({}), load: () => __webpack_require__.e/* import() */(0).then(__webpack_require__.bind(null, 15)) },
	{ pattern: /^\/throw-an-error\/?$/, ignore: true },
	{ pattern: /^\/redirect-from\/?$/, params: () => ({}), load: () => __webpack_require__.e/* import() */(9).then(__webpack_require__.bind(null, 16)) },
	{ pattern: /^\/slow-preload\/?$/, params: () => ({}), load: () => __webpack_require__.e/* import() */(6).then(__webpack_require__.bind(null, 17)) },
	{ pattern: /^\/redirect-to\/?$/, params: () => ({}), load: () => __webpack_require__.e/* import() */(8).then(__webpack_require__.bind(null, 18)) },
	{ pattern: /^\/delete-test\/?$/, params: () => ({}), load: () => __webpack_require__.e/* import() */(10).then(__webpack_require__.bind(null, 19)) },
	{ pattern: /^\/blog.json\/?$/, ignore: true },
	{ pattern: /^\/show-url\/?$/, params: () => ({}), load: () => __webpack_require__.e/* import() */(7).then(__webpack_require__.bind(null, 20)) },
	{ pattern: /^\/about\/?$/, params: () => ({}), load: () => __webpack_require__.e/* import() */(3).then(__webpack_require__.bind(null, 21)) },
	{ pattern: /^\/blog\/?$/, params: () => ({}), load: () => __webpack_require__.e/* import() */(1).then(__webpack_require__.bind(null, 22)) },
	{ pattern: /^\/blog(?:\/([^\/]+?).json)?\/?$/, ignore: true },
	{ pattern: /^\/blog(?:\/([^\/]+?))?\/?$/, params: match => ({ slug: match[1] }), load: () => __webpack_require__.e/* import() */(2).then(__webpack_require__.bind(null, 23)) },
	{ error: '5xx', load: () => __webpack_require__.e/* import() */(4).then(__webpack_require__.bind(null, 24)) },
	{ pattern: /^\/api\/delete(?:\/([^\/]+?))?\/?$/, ignore: true },
	{ error: '4xx', load: () => __webpack_require__.e/* import() */(5).then(__webpack_require__.bind(null, 25)) }
];
// CONCATENATED MODULE: ./app/client.js



window.init = () => {
	return Object(runtime["b" /* init */])(document.querySelector('#sapper'), routes);
};

/***/ })
/******/ ]);