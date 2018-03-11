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
function prefetchRoutes(pathnames) {
    if (!routes)
        throw new Error("You must call init() first");
    return routes
        .filter(function (route) {
        if (!pathnames)
            return true;
        return pathnames.some(function (pathname) {
            return route.error
                ? route.error === pathname
                : route.pattern.test(pathname);
        });
    })
        .reduce(function (promise, route) {
        return promise.then(route.load);
    }, Promise.resolve());
}

export { component, prefetch, init, goto, prefetchRoutes, prefetchRoutes as preloadRoutes };
