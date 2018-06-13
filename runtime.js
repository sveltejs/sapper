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

var manifest = typeof window !== 'undefined' && window.__SAPPER__;
var App;
var component;
var target;
var store;
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
    if (!url.pathname.startsWith(manifest.baseUrl))
        return null;
    var path = url.pathname.slice(manifest.baseUrl.length);
    var _loop_1 = function (route) {
        var match = route.pattern.exec(path);
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
            return { value: { url: url, route: route, props: { params: params, query: query_1, path: path } } };
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
function render(Page, props, scroll, token) {
    if (current_token !== token)
        return;
    var data = {
        Page: Page,
        props: props,
        preloading: false
    };
    if (component) {
        component.set(data);
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
        component = new App({
            target: target,
            data: data,
            store: store,
            hydrate: true
        });
    }
    if (scroll) {
        window.scrollTo(scroll.x, scroll.y);
    }
}
function prepare_route(Page, props) {
    var redirect = null;
    var error = null;
    if (!Page.preload) {
        return { Page: Page, props: props, redirect: redirect, error: error };
    }
    if (!component && manifest.preloaded) {
        return { Page: Page, props: Object.assign(props, manifest.preloaded), redirect: redirect, error: error };
    }
    if (component) {
        component.set({
            preloading: true
        });
    }
    return Promise.resolve(Page.preload.call({
        store: store,
        fetch: function (url, opts) { return window.fetch(url, opts); },
        redirect: function (statusCode, location) {
            redirect = { statusCode: statusCode, location: location };
        },
        error: function (statusCode, message) {
            error = { statusCode: statusCode, message: message };
        }
    }, props))["catch"](function (err) {
        error = { statusCode: 500, message: err };
    }).then(function (preloaded) {
        if (error) {
            var route = error.statusCode >= 400 && error.statusCode < 500
                ? errors['4xx']
                : errors['5xx'];
            return route.load().then(function (_a) {
                var Page = _a["default"];
                var err = error.message instanceof Error ? error.message : new Error(error.message);
                Object.assign(props, { status: error.statusCode, error: err });
                return { Page: Page, props: props, redirect: null };
            });
        }
        Object.assign(props, preloaded);
        return { Page: Page, props: props, redirect: redirect };
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
        target.route.load().then(function (mod) { return prepare_route(mod["default"], target.props); });
    prefetching = null;
    var token = current_token = {};
    return loaded.then(function (_a) {
        var Page = _a.Page, props = _a.props, redirect = _a.redirect;
        if (redirect) {
            return goto(redirect.location, { replaceState: true });
        }
        render(Page, props, scroll_history[id], token);
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
    var selected = select_route(new URL(href, document.baseURI));
    if (selected && (!prefetching || href !== prefetching.href)) {
        prefetching = {
            href: href,
            promise: selected.route.load().then(function (mod) { return prepare_route(mod["default"], selected.props); })
        };
    }
}
var mousemove_timeout;
function handle_mousemove(event) {
    clearTimeout(mousemove_timeout);
    mousemove_timeout = setTimeout(function () {
        trigger_prefetch(event);
    }, 20);
}
function trigger_prefetch(event) {
    var a = findAnchor(event.target);
    if (!a || a.rel !== 'prefetch')
        return;
    prefetch(a.href);
}
var inited;
function init(opts) {
    if (opts instanceof HTMLElement) {
        throw new Error("The signature of init(...) has changed \u2014 see https://sapper.svelte.technology/guide#0-11-to-0-12 for more information");
    }
    App = opts.App;
    target = opts.target;
    routes = opts.routes.filter(function (r) { return !r.error; });
    errors = {
        '4xx': opts.routes.find(function (r) { return r.error === '4xx'; }),
        '5xx': opts.routes.find(function (r) { return r.error === '5xx'; })
    };
    if (opts && opts.store) {
        store = opts.store(manifest.store);
    }
    if (!inited) { // this check makes HMR possible
        window.addEventListener('click', handle_click);
        window.addEventListener('popstate', handle_popstate);
        // prefetch
        window.addEventListener('touchstart', trigger_prefetch);
        window.addEventListener('mousemove', handle_mousemove);
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
    var target = select_route(new URL(href, document.baseURI));
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

export { App, component, prefetch, init, goto, prefetchRoutes, prefetchRoutes as preloadRoutes };
